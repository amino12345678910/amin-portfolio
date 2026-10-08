<?php
/**
 * Security Configuration - Centralized security settings
 * Optimized for shared hosting environments
 */

namespace Safonas\Security\Config;

class SecurityConfig
{
    private $config;
    
    public function __construct()
    {
        $this->loadConfiguration();
    }
    
    private function loadConfiguration(): void
    {
        $this->config = [
            // Core security settings
            'security' => [
                'max_request_size' => 10485760, // 10MB
                'max_input_length' => 65536,    // 64KB
                'session_lifetime' => 3600,     // 1 hour
                'token_lifetime' => 1800,       // 30 minutes
                'bcrypt_cost' => 12,
                'password_min_length' => 8,
                'enable_honeypot' => true,
                'enable_captcha' => false       // Disabled for shared hosting
            ],
            
            // Rate limiting settings
            'rate_limiting' => [
                'enabled' => true,
                'window_size' => 3600,          // 1 hour window
                'max_requests' => 100,          // Max requests per window
                'burst_limit' => 10,            // Burst requests allowed
                'contact_form_limit' => 5,      // Contact form specific
                'contact_form_window' => 7200,  // 2 hours
                'ban_duration' => 86400,        // 24 hours ban
                'progressive_delays' => [0, 60, 300, 900, 1800] // seconds
            ],
            
            // Input validation rules
            'validation' => [
                'email_max_length' => 320,
                'name_max_length' => 100,
                'subject_max_length' => 200,
                'message_max_length' => 5000,
                'phone_max_length' => 20,
                'company_max_length' => 100,
                'position_max_length' => 100,
                'revenue_max_length' => 50,
                'strict_mode' => true,
                'auto_trim' => true,
                'normalize_unicode' => true
            ],
            
            // Security headers
            'headers' => [
                'X-Content-Type-Options' => 'nosniff',
                'X-Frame-Options' => 'DENY',
                'X-XSS-Protection' => '1; mode=block',
                'Referrer-Policy' => 'strict-origin-when-cross-origin',
                'Permissions-Policy' => 'geolocation=(), microphone=(), camera=()',
                'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ],
            
            // CORS settings
            'cors' => [
                'allowed_origins' => [
                    'https://safonas.com',
                    'https://www.safonas.com',
                    'http://localhost:3000',
                    'http://localhost:8080'
                ],
                'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
                'allowed_headers' => ['Content-Type', 'X-Requested-With', 'X-CSRF-Token', 'Authorization'],
                'allow_credentials' => true,
                'max_age' => 86400
            ],
            
            // Session configuration
            'session' => [
                'cookie_httponly' => 1,
                'cookie_secure' => 1,
                'cookie_samesite' => 'Strict',
                'use_only_cookies' => 1,
                'gc_maxlifetime' => 3600,
                'cookie_lifetime' => 0,
                'name' => 'SAFONAS_SESS',
                'entropy_length' => 32,
                'hash_function' => 'sha256'
            ],
            
            // Encryption settings
            'encryption' => [
                'method' => 'AES-256-GCM',
                'key_length' => 32,
                'iv_length' => 16,
                'tag_length' => 16,
                'pbkdf2_iterations' => 10000,
                'salt_length' => 32
            ],
            
            // Logging configuration
            'logging' => [
                'enabled' => true,
                'level' => 'info',                    // debug, info, warning, error, critical
                'max_file_size' => 10485760,          // 10MB
                'max_files' => 5,
                'log_requests' => true,
                'log_ip_addresses' => true,
                'log_user_agents' => true,
                'retention_days' => 30,
                'compress_old_logs' => true
            ],
            
            // File upload security (future use)
            'file_upload' => [
                'enabled' => false,
                'max_size' => 5242880,               // 5MB
                'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
                'scan_for_viruses' => false,         // Not available on shared hosting
                'quarantine_suspicious' => true,
                'upload_path' => '../uploads/',
                'temp_path' => '../temp/'
            ],
            
            // Database security (future use)
            'database' => [
                'enabled' => false,
                'encrypt_sensitive_data' => true,
                'use_prepared_statements' => true,
                'log_queries' => false,              // Disabled for performance
                'connection_timeout' => 30,
                'query_timeout' => 60,
                'max_connections' => 10
            ],
            
            // API security
            'api' => [
                'enabled' => false,
                'require_auth' => true,
                'rate_limit' => 1000,               // requests per hour
                'token_expiry' => 3600,             // 1 hour
                'require_https' => true,
                'version' => 'v1',
                'response_format' => 'json'
            ],
            
            // Threat detection patterns
            'threats' => [
                'sql_injection' => '/(\bselect\b|\bunion\b|\binsert\b|\bdelete\b|\bupdate\b|\bdrop\b|\bcreate\b|\balter\b|\bexec\b)/i',
                'xss_script' => '/<script[^>]*>.*?<\/script>/is',
                'xss_javascript' => '/javascript\s*:/i',
                'path_traversal' => '/\.\.[\/\\\\]/',
                'command_injection' => '/(\b(system|exec|shell_exec|passthru|eval|base64_decode)\b|\||\;|\&)/i',
                'php_injection' => '/<\?php|<\?=|\?>/',
                'file_inclusion' => '/\b(include|require)(_once)?\s*\(/i',
                'email_header_injection' => '/[\r\n](to|cc|bcc|from|subject|content-type):/i'
            ],
            
            // Honeypot configuration
            'honeypot' => [
                'enabled' => true,
                'field_name' => 'website_url',       // Hidden field name
                'time_threshold' => 3,               // Minimum seconds to submit
                'log_attempts' => true
            ],
            
            // IP whitelist/blacklist
            'ip_control' => [
                'whitelist_enabled' => false,
                'blacklist_enabled' => true,
                'whitelist' => [],
                'blacklist' => [
                    // Known bad IPs can be added here
                ],
                'check_reputation' => false          // Disabled for shared hosting
            ],
            
            // Emergency mode
            'emergency' => [
                'enabled' => false,
                'allowed_ips' => ['127.0.0.1'],
                'maintenance_mode' => false,
                'security_mode' => false
            ]
        ];
    }
    
    public function get(string $key, $default = null)
    {
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
    
    public function getSecurityHeaders(): array
    {
        return $this->config['headers'];
    }
    
    public function getCorsSettings(): array
    {
        return $this->config['cors'];
    }
    
    public function getSessionConfig(): array
    {
        return $this->config['session'];
    }
    
    public function getRateLimitConfig(): array
    {
        return $this->config['rate_limiting'];
    }
    
    public function getValidationRules(): array
    {
        return $this->config['validation'];
    }
    
    public function getEncryptionConfig(): array
    {
        return $this->config['encryption'];
    }
    
    public function getLoggingConfig(): array
    {
        return $this->config['logging'];
    }
    
    public function getThreatPatterns(): array
    {
        return $this->config['threats'];
    }
    
    public function getHoneypotConfig(): array
    {
        return $this->config['honeypot'];
    }
    
    public function isEnabled(string $feature): bool
    {
        return $this->get($feature . '.enabled', false);
    }
    
    public function getEnvironmentConfig(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'is_https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'max_execution_time' => ini_get('max_execution_time'),
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size')
        ];
    }
}