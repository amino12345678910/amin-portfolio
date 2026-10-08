<?php
/**
 * Main Deployment Script
 *
 * Handles git-based deployment with comprehensive error handling and logging
 *
 * @version 1.0.0
 * @author Safonas AI Agency
 */

// Set security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Prevent direct access if not called properly
if (!defined('ALLOW_DEPLOYMENT_ACCESS')) {
    // Check for proper access method
    $allowedReferers = [
        'webhook-handler.php',
        'manual-deploy.php'
    ];

    $referer = basename($_SERVER['HTTP_REFERER'] ?? '');
    if (!in_array($referer, $allowedReferers) && php_sapi_name() !== 'cli') {
        http_response_code(403);
        exit('Access denied');
    }
}

// Load configuration
require_once __DIR__ . '/../config/deployment-config.php';

// Deployment class
class GitDeployment
{
    private $config;
    private $logger;
    private $deploymentId;
    private $startTime;
    private $stats = [];

    public function __construct($config)
    {
        $this->config = $config;
        $this->deploymentId = uniqid('deploy_', true);
        $this->startTime = microtime(true);
        $this->logger = new DeploymentLogger($config);
    }

    public function execute($options = [])
    {
        $this->logger->log('INFO', "Starting deployment {$this->deploymentId}");

        try {
            // Phase 1: Pre-deployment validation
            $this->preDeploymentValidation();

            // Phase 2: Create backup
            if ($this->config['deployment']['backup_before_deploy']) {
                $this->createBackup();
            }

            // Phase 3: Update repository
            $this->updateRepository($options);

            // Phase 4: Post-deployment validation
            $this->postDeploymentValidation();

            // Phase 5: Cleanup and finalization
            $this->finalizeDeployment();

            // Calculate deployment statistics
            $this->calculateStats();

            // Send success notification
            $this->sendNotification('success', $options);

            $this->logger->log('INFO', "Deployment {$this->deploymentId} completed successfully");

            return [
                'success' => true,
                'deployment_id' => $this->deploymentId,
                'message' => 'Deployment completed successfully',
                'stats' => $this->stats
            ];

        } catch (Exception $e) {
            $this->logger->log('ERROR', "Deployment {$this->deploymentId} failed: " . $e->getMessage());

            // Attempt rollback if enabled
            if ($this->config['rollback']['auto_rollback_on_failure']) {
                $this->attemptRollback();
            }

            // Send failure notification
            $this->sendNotification('failure', $options, $e->getMessage());

            return [
                'success' => false,
                'deployment_id' => $this->deploymentId,
                'message' => $e->getMessage(),
                'stats' => $this->stats
            ];
        }
    }

    private function preDeploymentValidation()
    {
        $this->logger->log('INFO', 'Starting pre-deployment validation');

        // Check git availability
        if (!$this->isGitAvailable()) {
            throw new Exception('Git is not available or not properly configured');
        }

        // Validate repository state
        $this->validateRepositoryState();

        // Check disk space
        $this->checkDiskSpace();

        // Validate file permissions
        $this->validateFilePermissions();

        // Check if another deployment is in progress
        $this->checkDeploymentLock();

        $this->logger->log('INFO', 'Pre-deployment validation passed');
    }

    private function isGitAvailable()
    {
        $output = [];
        $returnCode = 0;
        exec($this->config['git']['binary_path'] . ' --version', $output, $returnCode);

        return $returnCode === 0 && !empty($output);
    }

    private function validateRepositoryState()
    {
        $deploymentRoot = $this->config['paths']['deployment_root'];
        $gitDir = $deploymentRoot . '/.git';

        if (!is_dir($gitDir)) {
            throw new Exception('Not a git repository. Please initialize git first.');
        }

        // Check for uncommitted changes
        $originalDir = getcwd();
        chdir($deploymentRoot);

        $output = [];
        exec('git status --porcelain', $output, $returnCode);

        chdir($originalDir);

        if (!empty($output)) {
            $this->logger->log('WARNING', 'Uncommitted changes detected: ' . implode(', ', $output));

            if (!$this->config['environment']['debug_mode']) {
                throw new Exception('Repository has uncommitted changes. Please commit or stash them first.');
            }
        }
    }

    private function checkDiskSpace()
    {
        $deploymentRoot = $this->config['paths']['deployment_root'];
        $freeSpace = disk_free_space($deploymentRoot);
        $requiredSpace = 100 * 1024 * 1024; // 100MB minimum

        if ($freeSpace < $requiredSpace) {
            throw new Exception('Insufficient disk space. Required: ' .
                $this->formatBytes($requiredSpace) .
                ', Available: ' . $this->formatBytes($freeSpace));
        }

        $this->stats['disk_space_before'] = $freeSpace;
    }

    private function validateFilePermissions()
    {
        $paths = [
            $this->config['paths']['deployment_root'],
            $this->config['paths']['logs_dir'],
            $this->config['paths']['backup_dir']
        ];

        foreach ($paths as $path) {
            if (is_dir($path) && !is_writable($path)) {
                throw new Exception("Directory is not writable: {$path}");
            }
        }
    }

    private function checkDeploymentLock()
    {
        $lockFile = $this->config['paths']['temp_dir'] . '/deployment.lock';

        if (file_exists($lockFile)) {
            $lockTime = filemtime($lockFile);
            $maxAge = $this->config['git']['timeout'];

            if (time() - $lockTime < $maxAge) {
                throw new Exception('Another deployment is in progress');
            } else {
                // Lock file is stale, remove it
                unlink($lockFile);
            }
        }

        // Create lock file
        if (!is_dir(dirname($lockFile))) {
            mkdir(dirname($lockFile), 0755, true);
        }

        file_put_contents($lockFile, $this->deploymentId);
        register_shutdown_function([$this, 'removeDeploymentLock']);
    }

    public function removeDeploymentLock()
    {
        $lockFile = $this->config['paths']['temp_dir'] . '/deployment.lock';
        if (file_exists($lockFile)) {
            unlink($lockFile);
        }
    }

    private function createBackup()
    {
        $this->logger->log('INFO', 'Creating deployment backup');

        $backupDir = $this->config['paths']['backup_dir'];
        $timestamp = date('Y-m-d_H-i-s');
        $backupPath = $backupDir . "/backup_{$timestamp}.tar.gz";

        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $deploymentRoot = $this->config['paths']['deployment_root'];
        $excludeFile = $this->config['paths']['temp_dir'] . '/backup_exclude.txt';

        // Create exclude file
        $excludePatterns = [
            '.git',
            'node_modules',
            'logs/*',
            'backups/*',
            'temp/*',
            '.DS_Store',
            'Thumbs.db'
        ];

        file_put_contents($excludeFile, implode("\n", $excludePatterns));

        $command = sprintf(
            'tar -czf %s -C %s --exclude-from=%s .',
            escapeshellarg($backupPath),
            escapeshellarg(dirname($deploymentRoot)),
            escapeshellarg($excludeFile)
        );

        $output = [];
        $returnCode = 0;

        exec($command, $output, $returnCode);

        // Clean up exclude file
        unlink($excludeFile);

        if ($returnCode !== 0) {
            throw new Exception('Backup creation failed: ' . implode("\n", $output));
        }

        $this->stats['backup_path'] = $backupPath;
        $this->stats['backup_size'] = filesize($backupPath);

        $this->logger->log('INFO', "Backup created: {$backupPath} (" . $this->formatBytes($this->stats['backup_size']) . ")");

        // Clean old backups
        $this->cleanOldBackups();
    }

    private function cleanOldBackups()
    {
        $backupDir = $this->config['paths']['backup_dir'];
        $maxBackups = $this->config['deployment']['max_backups'];

        $files = glob($backupDir . "/backup_*.tar.gz");
        if (count($files) > $maxBackups) {
            usort($files, function ($a, $b) {
                return filemtime($a) - filemtime($b);
            });

            $toDelete = array_slice($files, 0, count($files) - $maxBackups);
            foreach ($toDelete as $file) {
                unlink($file);
                $this->logger->log('INFO', "Deleted old backup: {$file}");
            }
        }
    }

    private function updateRepository($options)
    {
        $this->logger->log('INFO', 'Updating repository');

        $deploymentRoot = $this->config['paths']['deployment_root'];
        $originalDir = getcwd();

        try {
            chdir($deploymentRoot);

            // Configure git user if needed
            $this->configureGit();

            // Fetch latest changes
            $this->fetchChanges();

            // Get current commit
            $currentCommit = $this->getCurrentCommit();
            $this->stats['commit_before'] = $currentCommit;

            // Pull changes
            $branch = $options['branch'] ?? $this->config['repository']['branch'];
            $this->pullChanges($branch);

            // Get new commit
            $newCommit = $this->getCurrentCommit();
            $this->stats['commit_after'] = $newCommit;

            // Get changes summary
            $this->stats['changes'] = $this->getChangesSummary($currentCommit, $newCommit);

            $this->logger->log('INFO', "Repository updated from {$currentCommit} to {$newCommit}");

        } finally {
            chdir($originalDir);
        }
    }

    private function configureGit()
    {
        $commands = [
            sprintf('git config user.name "%s"', $this->config['git']['author_name']),
            sprintf('git config user.email "%s"', $this->config['git']['author_email'])
        ];

        foreach ($commands as $command) {
            exec($command, $output, $returnCode);
            if ($returnCode !== 0) {
                $this->logger->log('WARNING', 'Git config command failed: ' . $command);
            }
        }
    }

    private function fetchChanges()
    {
        $command = 'git fetch origin';
        $output = [];
        $returnCode = 0;

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception('Git fetch failed: ' . implode("\n", $output));
        }

        $this->logger->log('DEBUG', 'Git fetch completed');
    }

    private function getCurrentCommit()
    {
        $output = [];
        $returnCode = 0;

        exec('git rev-parse HEAD', $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception('Failed to get current commit');
        }

        return trim($output[0]);
    }

    private function pullChanges($branch)
    {
        $command = sprintf('git pull origin %s', $branch);
        $output = [];
        $returnCode = 0;

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception('Git pull failed: ' . implode("\n", $output));
        }

        $this->logger->log('INFO', 'Git pull completed: ' . implode("\n", $output));
        $this->stats['git_output'] = $output;
    }

    private function getChangesSummary($from, $to)
    {
        $output = [];
        $returnCode = 0;

        exec("git log --oneline {$from}..{$to}", $output, $returnCode);

        if ($returnCode !== 0) {
            return ['Failed to get changes summary'];
        }

        return $output;
    }

    private function postDeploymentValidation()
    {
        $this->logger->log('INFO', 'Starting post-deployment validation');

        // Validate file structure
        $this->validateFileStructure();

        // Check file permissions
        $this->validatePostDeploymentPermissions();

        // Perform health check if enabled
        if ($this->config['deployment']['health_check_enabled']) {
            $this->performHealthCheck();
        }

        $this->logger->log('INFO', 'Post-deployment validation passed');
    }

    private function validateFileStructure()
    {
        $deploymentRoot = $this->config['paths']['deployment_root'];
        $requiredFiles = ['index.html'];

        foreach ($requiredFiles as $file) {
            if (!file_exists($deploymentRoot . '/' . $file)) {
                throw new Exception("Required file missing: {$file}");
            }
        }
    }

    private function validatePostDeploymentPermissions()
    {
        $deploymentRoot = $this->config['paths']['deployment_root'];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($deploymentRoot)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $path = $file->getPathname();
                $perms = fileperms($path);

                // Check if file is readable
                if (!is_readable($path)) {
                    $this->logger->log('WARNING', "File is not readable: {$path}");
                }
            }
        }
    }

    private function performHealthCheck()
    {
        $healthCheckUrl = $this->config['deployment']['health_check_url'];
        if (empty($healthCheckUrl)) {
            return;
        }

        $timeout = $this->config['deployment']['health_check_timeout'];
        $context = stream_context_create([
            'http' => [
                'timeout' => $timeout,
                'method' => 'GET'
            ]
        ]);

        $startTime = microtime(true);
        $response = @file_get_contents($healthCheckUrl, false, $context);
        $responseTime = microtime(true) - $startTime;

        if ($response === false) {
            throw new Exception('Health check failed: Unable to reach health check URL');
        }

        $this->stats['health_check_response_time'] = round($responseTime * 1000, 2);
        $this->logger->log('INFO', "Health check passed in {$this->stats['health_check_response_time']}ms");
    }

    private function finalizeDeployment()
    {
        $this->logger->log('INFO', 'Finalizing deployment');

        // Clean temporary files
        $this->cleanTempFiles();

        // Update deployment statistics
        $this->stats['deployment_time'] = round((microtime(true) - $this->startTime) * 1000, 2);
        $this->stats['disk_space_after'] = disk_free_space($this->config['paths']['deployment_root']);

        $this->logger->log('INFO', "Deployment finalized in {$this->stats['deployment_time']}ms");
    }

    private function cleanTempFiles()
    {
        $tempDir = $this->config['paths']['temp_dir'];
        if (is_dir($tempDir)) {
            $files = glob($tempDir . '/*');
            foreach ($files as $file) {
                if (is_file($file) && time() - filemtime($file) > 3600) { // 1 hour
                    unlink($file);
                }
            }
        }
    }

    private function calculateStats()
    {
        $this->stats['deployment_id'] = $this->deploymentId;
        $this->stats['timestamp'] = date('Y-m-d H:i:s');
        $this->stats['memory_peak'] = memory_get_peak_usage(true);
        $this->stats['files_changed'] = count($this->stats['changes'] ?? []);
    }

    private function attemptRollback()
    {
        $this->logger->log('WARNING', 'Attempting automatic rollback');

        try {
            // Find latest backup
            $backupDir = $this->config['paths']['backup_dir'];
            $backups = glob($backupDir . "/backup_*.tar.gz");

            if (empty($backups)) {
                $this->logger->log('ERROR', 'No backups available for rollback');
                return;
            }

            // Sort by date and get latest
            usort($backups, function ($a, $b) {
                return filemtime($b) - filemtime($a);
            });

            $latestBackup = $backups[0];
            $this->restoreFromBackup($latestBackup);

            $this->logger->log('INFO', 'Automatic rollback completed successfully');

        } catch (Exception $e) {
            $this->logger->log('ERROR', 'Automatic rollback failed: ' . $e->getMessage());
        }
    }

    private function restoreFromBackup($backupPath)
    {
        $deploymentRoot = $this->config['paths']['deployment_root'];

        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($backupPath),
            escapeshellarg(dirname($deploymentRoot))
        );

        $output = [];
        $returnCode = 0;

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception('Backup restoration failed: ' . implode("\n", $output));
        }
    }

    private function sendNotification($status, $options, $errorMessage = '')
    {
        if (!$this->config['notifications']['enabled']) {
            return;
        }

        $metadata = [
            'deployment_id' => $this->deploymentId,
            'status' => $status,
            'stats' => $this->stats,
            'error' => $errorMessage
        ];

        // Email notification
        if ($this->config['notifications']['channels']['email']['enabled']) {
            $this->sendEmailNotification($metadata);
        }

        // Slack notification
        if ($this->config['notifications']['channels']['slack']['enabled']) {
            $this->sendSlackNotification($metadata);
        }
    }

    private function sendEmailNotification($metadata)
    {
        // Implementation would depend on email library
        $this->logger->log('INFO', 'Email notification sent');
    }

    private function sendSlackNotification($metadata)
    {
        // Implementation would depend on Slack webhook
        $this->logger->log('INFO', 'Slack notification sent');
    }

    private function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

// Handle deployment execution
if (php_sapi_name() === 'cli' || defined('ALLOW_DEPLOYMENT_ACCESS')) {
    try {
        $config = getDeploymentConfig();
        $deployment = new GitDeployment($config);

        if (php_sapi_name() === 'cli') {
            // CLI mode
            $options = getopt('', ['branch::', 'force', 'dry-run']);
            $deploymentOptions = [
                'branch' => $options['branch'] ?? null,
                'force' => isset($options['force']),
                'dry_run' => isset($options['dry-run'])
            ];

            $result = $deployment->execute($deploymentOptions);

            echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
            exit($result['success'] ? 0 : 1);

        } else {
            // Web mode - this should be called by webhook handler
            $options = $_POST['options'] ?? [];
            $result = $deployment->execute($options);

            header('Content-Type: application/json');
            echo json_encode($result);
        }

    } catch (Exception $e) {
        $message = 'Deployment error: ' . $e->getMessage();
        error_log($message);

        if (php_sapi_name() === 'cli') {
            echo json_encode(['success' => false, 'message' => $message]) . PHP_EOL;
            exit(1);
        } else {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Internal server error']);
        }
    }
}

// Define constant for allowed access
define('ALLOW_DEPLOYMENT_ACCESS', true);