<?php
/**
 * Safonas Security Manager - Enterprise-Grade Security Framework
 * Optimized for shared hosting environments with cPanel
 * 
 * @author Safonas Security Team
 * @version 2.0.0
 * @license MIT
 */

namespace Safonas\Security;

require_once __DIR__ . '/config/SecurityConfig.php';
require_once __DIR__ . '/validation/InputValidator.php';
require_once __DIR__ . '/auth/CSRFProtection.php';
require_once __DIR__ . '/rate-limiting/RateLimiter.php';
require_once __DIR__ . '/encryption/EncryptionManager.php';
require_once __DIR__ . '/logging/SecurityLogger.php';

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Validation\InputValidator;
use Safonas\Security\Auth\CSRFProtection;
use Safonas\Security\RateLimit\RateLimiter;
use Safonas\Security\Encryption\EncryptionManager;
use Safonas\Security\Logging\SecurityLogger;

class SecurityManager
{
    private $config;
    private $validator;
    private $csrf;
    private $rateLimiter;
    private $encryption;
    private $logger;
    private $initialized = false;
    
    private static $instance = null;
    
    /**
     * Singleton pattern for global security management
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct()
    {
        $this->initializeComponents();
    }
    
    /**
     * Initialize all security components
     */
    private function initializeComponents(): void
    {
        try {
            $this->config = new SecurityConfig();
            $this->logger = new SecurityLogger($this->config);
            $this->validator = new InputValidator($this->config);
            $this->csrf = new CSRFProtection($this->config);
            $this->rateLimiter = new RateLimiter($this->config, $this->logger);
            $this->encryption = new EncryptionManager($this->config);
            
            $this->initialized = true;
            $this->logger->info('Security Manager initialized successfully');
            
        } catch (Exception $e) {
            $this->logger->critical('Failed to initialize Security Manager: ' . $e->getMessage());
            throw new SecurityException('Security initialization failed');
        }
    }
    
    /**
     * Apply comprehensive security headers
     */
    public function applySecurityHeaders(): void
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        $headers = $this->config->getSecurityHeaders();
        
        foreach ($headers as $header => $value) {
            if (!headers_sent()) {
                header("{$header}: {$value}");
            }
        }
        
        // Content Security Policy with strict rules
        $csp = $this->buildCSPHeader();
        if (!headers_sent()) {
            header("Content-Security-Policy: {$csp}");
        }
        
        $this->logger->debug('Security headers applied');
    }
    
    /**
     * Build Content Security Policy header
     */
    private function buildCSPHeader(): string
    {
        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ];
        
        return implode('; ', $directives);
    }
    
    /**
     * Validate incoming request comprehensively
     */
    public function validateRequest(array $data, array $rules = []): array
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        // Check rate limiting first
        $clientIp = $this->getClientIP();
        if (!$this->rateLimiter->checkLimit($clientIp)) {
            $this->logger->warning("Rate limit exceeded for IP: {$clientIp}");
            throw new SecurityException('Rate limit exceeded', 429);
        }
        
        // Validate CSRF token if present
        if (!empty($_POST) || !empty($_PUT)) {
            $this->csrf->validateToken();
        }
        
        // Validate input data
        $validatedData = $this->validator->validate($data, $rules);
        
        // Log successful validation
        $this->logger->info('Request validated successfully', [
            'ip' => $clientIp,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        return $validatedData;
    }
    
    /**
     * Secure session management
     */
    public function initializeSecureSession(): void
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        // Configure secure session settings
        $sessionConfig = $this->config->getSessionConfig();
        
        foreach ($sessionConfig as $setting => $value) {
            ini_set("session.{$setting}", $value);
        }
        
        // Start session with security measures
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
            
            // Regenerate session ID periodically for security
            if (!isset($_SESSION['created'])) {
                $_SESSION['created'] = time();
            } elseif (time() - $_SESSION['created'] > 1800) {
                session_regenerate_id(true);
                $_SESSION['created'] = time();
            }
            
            // Store client fingerprint
            $fingerprint = $this->generateClientFingerprint();
            if (isset($_SESSION['fingerprint'])) {
                if ($_SESSION['fingerprint'] !== $fingerprint) {
                    $this->logger->warning('Session hijacking attempt detected', [
                        'ip' => $this->getClientIP(),
                        'expected_fingerprint' => $_SESSION['fingerprint'],
                        'actual_fingerprint' => $fingerprint
                    ]);
                    session_destroy();
                    throw new SecurityException('Session security violation');
                }
            } else {
                $_SESSION['fingerprint'] = $fingerprint;
            }
        }
        
        $this->logger->debug('Secure session initialized');
    }
    
    /**
     * Generate client fingerprint for session security
     */
    private function generateClientFingerprint(): string
    {
        $components = [
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
            $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '',
            $this->getClientIP()
        ];
        
        return hash('sha256', implode('|', $components));
    }
    
    /**
     * Get real client IP address (accounting for proxies)
     */
    public function getClientIP(): string
    {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_CLIENT_IP',            // Proxy
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) && !empty($_SERVER[$key])) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    
                    // Validate IP and exclude private/reserved ranges
                    if (filter_var($ip, FILTER_VALIDATE_IP, 
                        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Encrypt sensitive data
     */
    public function encrypt(string $data): string
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        return $this->encryption->encrypt($data);
    }
    
    /**
     * Decrypt sensitive data
     */
    public function decrypt(string $encryptedData): string
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        return $this->encryption->decrypt($encryptedData);
    }
    
    /**
     * Generate secure random token
     */
    public function generateSecureToken(int $length = 32): string
    {
        if (function_exists('random_bytes')) {
            return bin2hex(random_bytes($length));
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            return bin2hex(openssl_random_pseudo_bytes($length));
        } else {
            // Fallback for older PHP versions
            return substr(str_shuffle(str_repeat('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', $length)), 0, $length);
        }
    }
    
    /**
     * Scan for malicious patterns in input
     */
    public function scanForThreats(string $input): array
    {
        $threats = [];
        $patterns = $this->config->getThreatPatterns();
        
        foreach ($patterns as $type => $pattern) {
            if (preg_match($pattern, $input)) {
                $threats[] = $type;
                $this->logger->warning("Threat detected: {$type}", [
                    'input_sample' => substr($input, 0, 100),
                    'ip' => $this->getClientIP()
                ]);
            }
        }
        
        return $threats;
    }
    
    /**
     * Log security event
     */
    public function logSecurityEvent(string $level, string $message, array $context = []): void
    {
        if (!$this->initialized) {
            return;
        }
        
        $context['ip'] = $this->getClientIP();
        $context['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $context['timestamp'] = date('c');
        
        $this->logger->log($level, $message, $context);
    }
    
    /**
     * Get CSRF token for forms
     */
    public function getCSRFToken(): string
    {
        if (!$this->initialized) {
            throw new SecurityException('Security Manager not initialized');
        }
        
        return $this->csrf->getToken();
    }
    
    /**
     * Check if current environment is secure
     */
    public function isSecureEnvironment(): bool
    {
        $checks = [
            'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'php_version' => version_compare(PHP_VERSION, '7.4.0', '>='),
            'openssl' => extension_loaded('openssl'),
            'session' => session_status() !== PHP_SESSION_DISABLED
        ];
        
        $passed = array_filter($checks);
        
        if (count($passed) < count($checks)) {
            $failed = array_diff_key($checks, $passed);
            $this->logger->warning('Security environment checks failed', ['failed_checks' => array_keys($failed)]);
        }
        
        return count($passed) === count($checks);
    }
    
    /**
     * Emergency security shutdown
     */
    public function emergencyShutdown(string $reason = 'Security breach detected'): void
    {
        $this->logger->critical('Emergency shutdown initiated', ['reason' => $reason]);
        
        // Clear sensitive session data
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];
            session_destroy();
        }
        
        // Send security headers
        if (!headers_sent()) {
            http_response_code(503);
            header('Content-Type: application/json');
            header('Cache-Control: no-store');
        }
        
        // Return generic error response
        $response = [
            'success' => false,
            'message' => 'Service temporarily unavailable for security reasons',
            'timestamp' => time()
        ];
        
        echo json_encode($response);
        exit();
    }
    
    /**
     * Get security status
     */
    public function getSecurityStatus(): array
    {
        return [
            'initialized' => $this->initialized,
            'secure_environment' => $this->isSecureEnvironment(),
            'session_active' => session_status() === PHP_SESSION_ACTIVE,
            'csrf_enabled' => $this->csrf->isEnabled(),
            'rate_limiting' => $this->rateLimiter->isEnabled(),
            'encryption' => $this->encryption->isAvailable(),
            'logging' => $this->logger->isEnabled()
        ];
    }
}

/**
 * Custom Security Exception
 */
class SecurityException extends Exception
{
    private $securityCode;
    
    public function __construct(string $message = '', int $code = 0, int $securityCode = 403, Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->securityCode = $securityCode;
    }
    
    public function getSecurityCode(): int
    {
        return $this->securityCode;
    }
}