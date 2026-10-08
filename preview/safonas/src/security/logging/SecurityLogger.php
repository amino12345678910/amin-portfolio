<?php
/**
 * Advanced Security Logging System
 * Comprehensive threat detection and event logging
 * 
 * @package Safonas\Security\Logging
 * @version 1.0.0
 */

namespace Safonas\Security\Logging;

use Safonas\Security\Config\SecurityConfig;

class SecurityLogger
{
    private $config;
    private $logDirectory;
    private $logFiles = [];
    private $logLevels = [
        'debug' => 0,
        'info' => 1,
        'notice' => 2,
        'warning' => 3,
        'error' => 4,
        'critical' => 5,
        'alert' => 6,
        'emergency' => 7
    ];
    private $currentLogLevel;
    private $maxFileSize;
    private $maxFiles;
    private $rotationEnabled = true;
    
    public function __construct(SecurityConfig $config)
    {
        $this->config = $config;
        $this->logDirectory = dirname(__DIR__, 3) . '/logs/security/';
        $this->currentLogLevel = $this->logLevels[$config->get('logging.level', 'info')];
        $this->maxFileSize = $config->get('logging.max_file_size', 5242880); // 5MB
        $this->maxFiles = $config->get('logging.max_files', 5);
        
        $this->initializeLogging();
    }
    
    /**
     * Log debug message
     */
    public function debug(string $message, array $context = []): void
    {
        $this->log('debug', $message, $context);
    }
    
    /**
     * Log info message
     */
    public function info(string $message, array $context = []): void
    {
        $this->log('info', $message, $context);
    }
    
    /**
     * Log notice message
     */
    public function notice(string $message, array $context = []): void
    {
        $this->log('notice', $message, $context);
    }
    
    /**
     * Log warning message
     */
    public function warning(string $message, array $context = []): void
    {
        $this->log('warning', $message, $context);
    }
    
    /**
     * Log error message
     */
    public function error(string $message, array $context = []): void
    {
        $this->log('error', $message, $context);
    }
    
    /**
     * Log critical message
     */
    public function critical(string $message, array $context = []): void
    {
        $this->log('critical', $message, $context);
    }
    
    /**
     * Log alert message
     */
    public function alert(string $message, array $context = []): void
    {
        $this->log('alert', $message, $context);
    }
    
    /**
     * Log emergency message
     */
    public function emergency(string $message, array $context = []): void
    {
        $this->log('emergency', $message, $context);
    }
    
    /**
     * Main logging method
     */
    public function log(string $level, string $message, array $context = []): void
    {
        if (!$this->shouldLog($level)) {
            return;
        }
        
        $logEntry = $this->formatLogEntry($level, $message, $context);
        
        // Write to appropriate log files
        $this->writeToFile('main', $logEntry);
        
        // Write to specific log files based on context
        if (isset($context['type'])) {
            $this->writeToFile($context['type'], $logEntry);
        }
        
        // Write security events to separate file
        if ($this->isSecurityEvent($level, $message, $context)) {
            $this->writeToFile('security_events', $logEntry);
        }
        
        // Write threats to separate file
        if ($this->isThreatEvent($level, $message, $context)) {
            $this->writeToFile('threats', $logEntry);
        }
        
        // Rotate logs if necessary
        if ($this->rotationEnabled) {
            $this->rotateLogs();
        }
    }
    
    /**
     * Log security event with enhanced context
     */
    public function logSecurityEvent(string $eventType, string $message, array $context = []): void
    {
        $enhancedContext = array_merge($context, [
            'type' => 'security',
            'event_type' => $eventType,
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'timestamp' => time(),
            'session_id' => session_id(),
            'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown'
        ]);
        
        $level = $this->getSecurityEventLevel($eventType);
        $this->log($level, $message, $enhancedContext);
    }
    
    /**
     * Log threat detection
     */
    public function logThreat(string $threatType, string $description, array $details = []): void
    {
        $context = array_merge($details, [
            'type' => 'threat',
            'threat_type' => $threatType,
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_data' => $this->sanitizeRequestData(),
            'timestamp' => time(),
            'severity' => $this->getThreatSeverity($threatType)
        ]);
        
        $this->critical("THREAT DETECTED: {$description}", $context);
    }
    
    /**
     * Log rate limiting event
     */
    public function logRateLimit(string $identifier, string $action, array $details = []): void
    {
        $context = array_merge($details, [
            'type' => 'rate_limit',
            'identifier' => $identifier,
            'action' => $action,
            'ip' => $this->getClientIP(),
            'timestamp' => time()
        ]);
        
        $this->warning("Rate limit exceeded for {$identifier}:{$action}", $context);
    }
    
    /**
     * Log authentication event
     */
    public function logAuth(string $event, string $username, bool $success, array $details = []): void
    {
        $context = array_merge($details, [
            'type' => 'auth',
            'event' => $event,
            'username' => $username,
            'success' => $success,
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => time()
        ]);
        
        $level = $success ? 'info' : 'warning';
        $status = $success ? 'SUCCESS' : 'FAILED';
        
        $this->log($level, "Authentication {$event}: {$status} for user {$username}", $context);
    }
    
    /**
     * Log data access event
     */
    public function logDataAccess(string $resource, string $action, array $context = []): void
    {
        $enhancedContext = array_merge($context, [
            'type' => 'data_access',
            'resource' => $resource,
            'action' => $action,
            'ip' => $this->getClientIP(),
            'timestamp' => time()
        ]);
        
        $this->info("Data access: {$action} on {$resource}", $enhancedContext);
    }
    
    /**
     * Get security analytics
     */
    public function getSecurityAnalytics(int $hours = 24): array
    {
        $since = time() - ($hours * 3600);
        $analytics = [
            'time_range' => $hours,
            'total_events' => 0,
            'events_by_type' => [],
            'events_by_level' => [],
            'top_ips' => [],
            'top_threats' => [],
            'authentication_stats' => [
                'total_attempts' => 0,
                'successful' => 0,
                'failed' => 0
            ],
            'rate_limit_violations' => 0
        ];
        
        // Analyze main log file
        $logFile = $this->getLogFile('main');
        if (file_exists($logFile)) {
            $analytics = $this->analyzeLogFile($logFile, $since, $analytics);
        }
        
        // Analyze security events file
        $securityFile = $this->getLogFile('security_events');
        if (file_exists($securityFile)) {
            $analytics = $this->analyzeSecurityFile($securityFile, $since, $analytics);
        }
        
        return $analytics;
    }
    
    /**
     * Search logs for specific patterns
     */
    public function searchLogs(string $pattern, int $maxResults = 100, int $hours = 24): array
    {
        $since = time() - ($hours * 3600);
        $results = [];
        
        $logFiles = ['main', 'security_events', 'threats'];
        
        foreach ($logFiles as $type) {
            $file = $this->getLogFile($type);
            if (file_exists($file)) {
                $results = array_merge($results, $this->searchLogFile($file, $pattern, $since));
            }
        }
        
        // Sort by timestamp (newest first)
        usort($results, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        return array_slice($results, 0, $maxResults);
    }
    
    /**
     * Export logs for external analysis
     */
    public function exportLogs(string $format = 'json', int $hours = 24): string
    {
        $since = time() - ($hours * 3600);
        $logs = [];
        
        $logFiles = ['main', 'security_events', 'threats'];
        
        foreach ($logFiles as $type) {
            $file = $this->getLogFile($type);
            if (file_exists($file)) {
                $logs[$type] = $this->extractLogsFromFile($file, $since);
            }
        }
        
        switch ($format) {
            case 'csv':
                return $this->exportToCsv($logs);
            case 'xml':
                return $this->exportToXml($logs);
            case 'json':
            default:
                return json_encode($logs, JSON_PRETTY_PRINT);
        }
    }
    
    /**
     * Check if logging is enabled
     */
    public function isEnabled(): bool
    {
        return $this->config->get('logging.enabled', true);
    }
    
    /**
     * Get log statistics
     */
    public function getLogStatistics(): array
    {
        $stats = [
            'enabled' => $this->isEnabled(),
            'log_level' => array_search($this->currentLogLevel, $this->logLevels),
            'log_directory' => $this->logDirectory,
            'max_file_size' => $this->maxFileSize,
            'max_files' => $this->maxFiles,
            'rotation_enabled' => $this->rotationEnabled,
            'log_files' => []
        ];
        
        // Get info about each log file
        foreach ($this->logFiles as $type => $file) {
            if (file_exists($file)) {
                $stats['log_files'][$type] = [
                    'path' => $file,
                    'size' => filesize($file),
                    'modified' => filemtime($file),
                    'readable' => is_readable($file),
                    'writable' => is_writable($file)
                ];
            }
        }
        
        return $stats;
    }
    
    /**
     * Initialize logging system
     */
    private function initializeLogging(): void
    {
        // Create log directory if it doesn't exist
        if (!is_dir($this->logDirectory)) {
            mkdir($this->logDirectory, 0755, true);
        }
        
        // Set up log files
        $this->logFiles = [
            'main' => $this->logDirectory . 'security.log',
            'security_events' => $this->logDirectory . 'security_events.log',
            'threats' => $this->logDirectory . 'threats.log',
            'auth' => $this->logDirectory . 'auth.log',
            'rate_limit' => $this->logDirectory . 'rate_limit.log',
            'data_access' => $this->logDirectory . 'data_access.log'
        ];
        
        // Ensure log files are writable
        foreach ($this->logFiles as $file) {
            if (!file_exists($file)) {
                touch($file);
            }
            chmod($file, 0644);
        }
    }
    
    /**
     * Check if message should be logged based on level
     */
    private function shouldLog(string $level): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }
        
        $messageLevel = $this->logLevels[$level] ?? 0;
        return $messageLevel >= $this->currentLogLevel;
    }
    
    /**
     * Format log entry
     */
    private function formatLogEntry(string $level, string $message, array $context): string
    {
        $timestamp = date('Y-m-d H:i:s');
        $ip = $this->getClientIP();
        
        $entry = [
            'timestamp' => $timestamp,
            'level' => strtoupper($level),
            'ip' => $ip,
            'message' => $message,
            'context' => $context,
            'memory_usage' => memory_get_usage(true),
            'request_id' => $this->getRequestId()
        ];
        
        return json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    /**
     * Write log entry to file
     */
    private function writeToFile(string $type, string $entry): void
    {
        $file = $this->getLogFile($type);
        
        if ($file && is_writable(dirname($file))) {
            file_put_contents($file, $entry, FILE_APPEND | LOCK_EX);
        }
    }
    
    /**
     * Get log file path for type
     */
    private function getLogFile(string $type): ?string
    {
        return $this->logFiles[$type] ?? null;
    }
    
    /**
     * Check if event is security-related
     */
    private function isSecurityEvent(string $level, string $message, array $context): bool
    {
        $securityKeywords = ['security', 'attack', 'threat', 'violation', 'breach', 'unauthorized', 'csrf', 'xss', 'injection'];
        
        foreach ($securityKeywords as $keyword) {
            if (stripos($message, $keyword) !== false) {
                return true;
            }
        }
        
        return isset($context['type']) && in_array($context['type'], ['security', 'threat', 'attack']);
    }
    
    /**
     * Check if event is threat-related
     */
    private function isThreatEvent(string $level, string $message, array $context): bool
    {
        $threatLevels = ['critical', 'alert', 'emergency'];
        
        if (in_array($level, $threatLevels)) {
            return true;
        }
        
        return isset($context['type']) && $context['type'] === 'threat';
    }
    
    /**
     * Get security event level based on type
     */
    private function getSecurityEventLevel(string $eventType): string
    {
        $levelMap = [
            'login_attempt' => 'info',
            'login_failure' => 'warning',
            'account_locked' => 'warning',
            'privilege_escalation' => 'critical',
            'data_breach' => 'emergency',
            'unauthorized_access' => 'alert',
            'malicious_request' => 'critical',
            'rate_limit_exceeded' => 'warning'
        ];
        
        return $levelMap[$eventType] ?? 'info';
    }
    
    /**
     * Get threat severity level
     */
    private function getThreatSeverity(string $threatType): string
    {
        $severityMap = [
            'sql_injection' => 'critical',
            'xss' => 'high',
            'csrf' => 'medium',
            'path_traversal' => 'high',
            'command_injection' => 'critical',
            'file_inclusion' => 'high',
            'xxe' => 'high',
            'dos' => 'medium',
            'brute_force' => 'medium'
        ];
        
        return $severityMap[$threatType] ?? 'medium';
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP(): string
    {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) && !empty($_SERVER[$key])) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Get unique request ID
     */
    private function getRequestId(): string
    {
        static $requestId = null;
        
        if ($requestId === null) {
            $requestId = substr(hash('sha256', uniqid(mt_rand(), true)), 0, 8);
        }
        
        return $requestId;
    }
    
    /**
     * Sanitize request data for logging
     */
    private function sanitizeRequestData(): array
    {
        $data = array_merge($_GET, $_POST);
        
        // Remove sensitive fields
        $sensitiveFields = ['password', 'token', 'csrf_token', 'api_key'];
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }
        
        // Limit data size
        foreach ($data as $key => $value) {
            if (is_string($value) && strlen($value) > 200) {
                $data[$key] = substr($value, 0, 200) . '...';
            }
        }
        
        return $data;
    }
    
    /**
     * Rotate log files when they get too large
     */
    private function rotateLogs(): void
    {
        foreach ($this->logFiles as $type => $file) {
            if (file_exists($file) && filesize($file) > $this->maxFileSize) {
                $this->rotateLogFile($file, $type);
            }
        }
    }
    
    /**
     * Rotate a specific log file
     */
    private function rotateLogFile(string $file, string $type): void
    {
        // Create rotated filename
        $rotatedFile = $file . '.' . date('Y-m-d-H-i-s');
        
        // Move current file
        if (rename($file, $rotatedFile)) {
            // Create new empty file
            touch($file);
            chmod($file, 0644);
            
            // Compress old file if possible
            if (function_exists('gzopen')) {
                $this->compressLogFile($rotatedFile);
            }
            
            // Clean up old files
            $this->cleanupOldLogFiles($type);
        }
    }
    
    /**
     * Compress log file
     */
    private function compressLogFile(string $file): void
    {
        $gzFile = $file . '.gz';
        $data = file_get_contents($file);
        
        if ($data && file_put_contents($gzFile, gzencode($data))) {
            unlink($file);
        }
    }
    
    /**
     * Clean up old log files
     */
    private function cleanupOldLogFiles(string $type): void
    {
        $pattern = $this->logFiles[$type] . '.*';
        $files = glob($pattern);
        
        if (count($files) > $this->maxFiles) {
            // Sort by modification time
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            // Remove oldest files
            $filesToRemove = array_slice($files, 0, count($files) - $this->maxFiles);
            foreach ($filesToRemove as $file) {
                unlink($file);
            }
        }
    }
    
    // Additional methods for log analysis would go here...
    private function analyzeLogFile(string $file, int $since, array $analytics): array
    {
        // Implementation for log analysis
        return $analytics;
    }
    
    private function analyzeSecurityFile(string $file, int $since, array $analytics): array
    {
        // Implementation for security log analysis
        return $analytics;
    }
    
    private function searchLogFile(string $file, string $pattern, int $since): array
    {
        // Implementation for log searching
        return [];
    }
    
    private function extractLogsFromFile(string $file, int $since): array
    {
        // Implementation for log extraction
        return [];
    }
    
    private function exportToCsv(array $logs): string
    {
        // Implementation for CSV export
        return '';
    }
    
    private function exportToXml(array $logs): string
    {
        // Implementation for XML export
        return '';
    }
}