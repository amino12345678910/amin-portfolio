<?php
/**
 * Deployment Configuration
 *
 * Secure configuration management for automated deployment system
 *
 * @version 1.0.0
 * @author Safonas AI Agency
 */

// Prevent direct access
if (!defined('DEPLOYMENT_CONFIG_LOADED')) {
    http_response_code(403);
    exit('Access denied');
}

define('DEPLOYMENT_CONFIG_LOADED', true);

/**
 * Deployment Settings
 */
return [
    // Repository Configuration
    'repository' => [
        'url' => $_ENV['GITHUB_REPO_URL'] ?? 'https://github.com/your-username/your-repo.git',
        'branch' => $_ENV['DEPLOYMENT_BRANCH'] ?? 'main',
        'ssh_key_path' => $_ENV['SSH_KEY_PATH'] ?? null,
    ],

    // GitHub Webhook Configuration
    'webhook' => [
        'secret' => $_ENV['GITHUB_WEBHOOK_SECRET'] ?? null,
        'allowed_ips' => [
            // GitHub webhook IP ranges (update as needed)
            '192.30.252.0/22',
            '185.199.108.0/22',
            '140.82.112.0/20',
            '143.55.64.0/20',
        ],
        'timeout' => 30, // seconds
        'rate_limit' => [
            'requests' => 5,
            'window' => 60, // seconds
        ],
    ],

    // Deployment Paths
    'paths' => [
        'deployment_root' => $_ENV['DEPLOYMENT_ROOT'] ?? __DIR__ . '/../',
        'git_repository' => $_ENV['GIT_REPO_PATH'] ?? __DIR__ . '/../.git',
        'backup_dir' => __DIR__ . '/../backups',
        'logs_dir' => __DIR__ . '/../logs',
        'temp_dir' => sys_get_temp_dir() . '/deployment',
    ],

    // Security Settings
    'security' => [
        'require_signature' => true,
        'require_ip_whitelist' => true,
        'max_payload_size' => 10 * 1024 * 1024, // 10MB
        'allowed_file_extensions' => [
            'php', 'html', 'css', 'js', 'json', 'txt', 'md',
            'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'
        ],
        'blocked_patterns' => [
            '/eval\s*\(/',
            '/exec\s*\(/',
            '/system\s*\(/',
            '/shell_exec\s*\(/',
            '/passthru\s*\(/',
            '/file_get_contents\s*\(/',
            '/fopen\s*\(/',
            '/`.*`/', // backticks
        ],
    ],

    // Git Configuration
    'git' => [
        'binary_path' => 'git', // Assumes git is in PATH
        'timeout' => 300, // 5 minutes
        'author_name' => $_ENV['GIT_AUTHOR_NAME'] ?? 'Deployment Bot',
        'author_email' => $_ENV['GIT_AUTHOR_EMAIL'] ?? 'deploy@safonas.tn',
        'commands' => [
            'pull' => 'git pull origin %s',
            'status' => 'git status',
            'log' => 'git log --oneline -5',
            'reset_hard' => 'git reset --hard %s',
            'clean' => 'git clean -fd',
        ],
    ],

    // Deployment Settings
    'deployment' => [
        'auto_deploy' => true,
        'backup_before_deploy' => true,
        'max_backups' => 5,
        'health_check_enabled' => true,
        'health_check_url' => $_ENV['HEALTH_CHECK_URL'] ?? null,
        'health_check_timeout' => 10,
        'notification_email' => $_ENV['NOTIFICATION_EMAIL'] ?? null,
    ],

    // Logging Configuration
    'logging' => [
        'enabled' => true,
        'level' => $_ENV['LOG_LEVEL'] ?? 'INFO', // DEBUG, INFO, WARNING, ERROR
        'max_log_files' => 10,
        'max_log_size' => 10 * 1024 * 1024, // 10MB
        'date_format' => 'Y-m-d H:i:s',
    ],

    // Rollback Configuration
    'rollback' => [
        'enabled' => true,
        'auto_rollback_on_failure' => true,
        'max_rollback_attempts' => 3,
        'confirmation_required' => true,
    ],

    // Environment Detection
    'environment' => [
        'type' => $_ENV['ENVIRONMENT'] ?? 'production',
        'debug_mode' => filter_var($_ENV['DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'maintenance_mode' => false,
    ],

    // Performance Settings
    'performance' => [
        'max_execution_time' => 300, // 5 minutes
        'memory_limit' => '512M',
        'enable_compression' => true,
    ],

    // Notification Settings
    'notifications' => [
        'enabled' => true,
        'channels' => [
            'email' => [
                'enabled' => !empty($_ENV['NOTIFICATION_EMAIL']),
                'smtp_host' => $_ENV['SMTP_HOST'] ?? null,
                'smtp_port' => $_ENV['SMTP_PORT'] ?? 587,
                'smtp_username' => $_ENV['SMTP_USERNAME'] ?? null,
                'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? null,
                'from_email' => $_ENV['FROM_EMAIL'] ?? 'noreply@safonas.tn',
                'from_name' => 'Safonas Deployment System',
            ],
            'slack' => [
                'enabled' => !empty($_ENV['SLACK_WEBHOOK_URL']),
                'webhook_url' => $_ENV['SLACK_WEBHOOK_URL'] ?? null,
                'channel' => $_ENV['SLACK_CHANNEL'] ?? '#deployments',
            ],
        ],
    ],
];

/**
 * Environment Validation
 */
function validateDeploymentConfig($config) {
    $errors = [];

    // Validate required settings
    if (empty($config['webhook']['secret'])) {
        $errors[] = 'GitHub webhook secret is required';
    }

    if (empty($config['repository']['url'])) {
        $errors[] = 'Repository URL is required';
    }

    // Validate paths
    foreach ($config['paths'] as $name => $path) {
        if ($name !== 'git_repository' && !is_dir($path)) {
            @mkdir($path, 0755, true);
        }
    }

    // Check git availability
    if (!function_exists('shell_exec')) {
        $errors[] = 'shell_exec() function is required but disabled';
    }

    return $errors;
}

/**
 * Get current configuration
 */
function getDeploymentConfig() {
    static $config = null;

    if ($config === null) {
        $config = include __DIR__ . '/deployment-config.php';
        $errors = validateDeploymentConfig($config);

        if (!empty($errors)) {
            error_log('Deployment configuration errors: ' . implode(', ', $errors));
            if ($config['environment']['debug_mode']) {
                throw new Exception('Configuration errors: ' . implode(', ', $errors));
            }
        }
    }

    return $config;
}