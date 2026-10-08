<?php
/**
 * Advanced CSRF Protection with Token Rotation and Double Submit
 * Enhanced security for form submissions and AJAX requests
 * 
 * @package Safonas\Security\Auth
 * @version 1.0.0
 */

namespace Safonas\Security\Auth;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;

class CSRFProtection
{
    private $config;
    private $logger;
    private $tokenName;
    private $cookieName;
    private $tokenLifetime;
    private $doubleSubmit;
    private $hmacValidation;
    private $secretKey;
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger = null)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->tokenName = $config->get('csrf.token_name', 'csrf_token');
        $this->cookieName = $config->get('csrf.cookie_name', 'csrf_cookie');
        $this->tokenLifetime = $config->get('csrf.token_lifetime', 3600);
        $this->doubleSubmit = $config->get('csrf.double_submit_cookie', true);
        $this->hmacValidation = $config->get('csrf.hmac_validation', true);
        $this->secretKey = $this->getOrCreateSecretKey();
        
        $this->initializeSession();
    }
    
    /**
     * Generate CSRF token
     */
    public function generateToken(): string
    {
        $token = $this->createToken();
        
        // Store in session
        $_SESSION['csrf_tokens'][$token] = [
            'created' => time(),
            'used' => false,
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ];
        
        // Set double submit cookie if enabled
        if ($this->doubleSubmit) {
            $this->setCSRFCookie($token);
        }
        
        $this->cleanupExpiredTokens();
        
        if ($this->logger) {
            $this->logger->debug('CSRF token generated', [
                'token_hash' => substr(hash('sha256', $token), 0, 8),
                'double_submit' => $this->doubleSubmit
            ]);
        }
        
        return $token;
    }
    
    /**
     * Get current valid token or generate new one
     */
    public function getToken(): string
    {
        // Check for existing valid token
        if (isset($_SESSION['csrf_tokens'])) {
            foreach ($_SESSION['csrf_tokens'] as $token => $data) {
                if (!$data['used'] && !$this->isTokenExpired($data['created'])) {
                    return $token;
                }
            }
        }
        
        // Generate new token if none valid
        return $this->generateToken();
    }
    
    /**
     * Validate CSRF token
     */
    public function validateToken(string $token = null): bool
    {
        try {
            // Get token from various sources
            $token = $token ?? $this->getTokenFromRequest();
            
            if (empty($token)) {
                $this->logViolation('Token missing from request');
                return false;
            }
            
            // Check session token
            if (!$this->validateSessionToken($token)) {
                return false;
            }
            
            // Check double submit cookie if enabled
            if ($this->doubleSubmit && !$this->validateDoubleSubmit($token)) {
                return false;
            }
            
            // Check HMAC if enabled
            if ($this->hmacValidation && !$this->validateHMAC($token)) {
                return false;
            }
            
            // Mark token as used if regenerate_on_use is enabled
            if ($this->config->get('csrf.regenerate_on_use', true)) {
                $this->markTokenAsUsed($token);
            }
            
            if ($this->logger) {
                $this->logger->debug('CSRF token validated successfully', [
                    'token_hash' => substr(hash('sha256', $token), 0, 8)
                ]);
            }
            
            return true;
            
        } catch (\Exception $e) {
            $this->logViolation('Token validation error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Validate token and throw exception on failure
     */
    public function validateTokenStrict(string $token = null): void
    {
        if (!$this->validateToken($token)) {
            throw new CSRFException('CSRF token validation failed');
        }
    }
    
    /**
     * Generate form HTML with CSRF token
     */
    public function generateFormField(string $fieldName = null): string
    {
        $fieldName = $fieldName ?? $this->tokenName;
        $token = $this->getToken();
        
        return sprintf(
            '<input type="hidden" name="%s" value="%s" autocomplete="off">',
            htmlspecialchars($fieldName, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8')
        );
    }
    
    /**
     * Generate meta tag for AJAX requests
     */
    public function generateMetaTag(): string
    {
        $token = $this->getToken();
        
        return sprintf(
            '<meta name="csrf-token" content="%s">',
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8')
        );
    }
    
    /**
     * Generate JavaScript configuration
     */
    public function generateJavaScriptConfig(): string
    {
        $token = $this->getToken();
        $tokenName = $this->tokenName;
        
        return sprintf(
            '<script>window.csrfConfig = { token: "%s", name: "%s" };</script>',
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($tokenName, ENT_QUOTES, 'UTF-8')
        );
    }
    
    /**
     * Rotate all tokens (invalidate existing ones)
     */
    public function rotateTokens(): void
    {
        $_SESSION['csrf_tokens'] = [];
        
        // Clear cookie
        if ($this->doubleSubmit) {
            setcookie($this->cookieName, '', time() - 3600, '/', '', true, true);
        }
        
        if ($this->logger) {
            $this->logger->info('CSRF tokens rotated', [
                'ip' => $this->getClientIP()
            ]);
        }
    }
    
    /**
     * Check if CSRF protection is enabled
     */
    public function isEnabled(): bool
    {
        return $this->config->get('csrf.enabled', true);
    }
    
    /**
     * Get CSRF statistics
     */
    public function getStatistics(): array
    {
        $tokens = $_SESSION['csrf_tokens'] ?? [];
        
        $stats = [
            'enabled' => $this->isEnabled(),
            'total_tokens' => count($tokens),
            'active_tokens' => 0,
            'expired_tokens' => 0,
            'used_tokens' => 0,
            'double_submit' => $this->doubleSubmit,
            'hmac_validation' => $this->hmacValidation,
            'token_lifetime' => $this->tokenLifetime
        ];
        
        $currentTime = time();
        foreach ($tokens as $data) {
            if ($data['used']) {
                $stats['used_tokens']++;
            } elseif ($this->isTokenExpired($data['created'])) {
                $stats['expired_tokens']++;
            } else {
                $stats['active_tokens']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Create secure token
     */
    private function createToken(): string
    {
        $randomBytes = random_bytes(32);
        $timestamp = time();
        $clientInfo = $this->getClientFingerprint();
        
        $tokenData = $randomBytes . pack('N', $timestamp) . $clientInfo;
        
        if ($this->hmacValidation) {
            $hmac = hash_hmac('sha256', $tokenData, $this->secretKey, true);
            $tokenData = $hmac . $tokenData;
        }
        
        return base64_encode($tokenData);
    }
    
    /**
     * Get token from request
     */
    private function getTokenFromRequest(): ?string
    {
        // Check POST data
        if (isset($_POST[$this->tokenName])) {
            return $_POST[$this->tokenName];
        }
        
        // Check headers (for AJAX)
        $headerName = 'HTTP_X_' . str_replace('-', '_', strtoupper($this->tokenName));
        if (isset($_SERVER[$headerName])) {
            return $_SERVER[$headerName];
        }
        
        // Check X-CSRF-Token header
        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            return $_SERVER['HTTP_X_CSRF_TOKEN'];
        }
        
        return null;
    }
    
    /**
     * Validate session token
     */
    private function validateSessionToken(string $token): bool
    {
        if (!isset($_SESSION['csrf_tokens'][$token])) {
            $this->logViolation('Token not found in session');
            return false;
        }
        
        $tokenData = $_SESSION['csrf_tokens'][$token];
        
        // Check if token is expired
        if ($this->isTokenExpired($tokenData['created'])) {
            $this->logViolation('Token expired');
            unset($_SESSION['csrf_tokens'][$token]);
            return false;
        }
        
        // Check if token was already used (if regeneration is enabled)
        if ($tokenData['used'] && $this->config->get('csrf.regenerate_on_use', true)) {
            $this->logViolation('Token already used');
            return false;
        }
        
        // Validate client fingerprint
        if (!$this->validateClientFingerprint($tokenData)) {
            $this->logViolation('Client fingerprint mismatch');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate double submit cookie
     */
    private function validateDoubleSubmit(string $token): bool
    {
        $cookieToken = $_COOKIE[$this->cookieName] ?? '';
        
        if (empty($cookieToken)) {
            $this->logViolation('Double submit cookie missing');
            return false;
        }
        
        if (!hash_equals($token, $cookieToken)) {
            $this->logViolation('Double submit cookie mismatch');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate HMAC signature
     */
    private function validateHMAC(string $token): bool
    {
        try {
            $tokenData = base64_decode($token);
            
            if (strlen($tokenData) < 32) { // HMAC is 32 bytes
                return false;
            }
            
            $providedHmac = substr($tokenData, 0, 32);
            $actualData = substr($tokenData, 32);
            
            $expectedHmac = hash_hmac('sha256', $actualData, $this->secretKey, true);
            
            return hash_equals($expectedHmac, $providedHmac);
            
        } catch (\Exception $e) {
            $this->logViolation('HMAC validation error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if token is expired
     */
    private function isTokenExpired(int $created): bool
    {
        return (time() - $created) > $this->tokenLifetime;
    }
    
    /**
     * Mark token as used
     */
    private function markTokenAsUsed(string $token): void
    {
        if (isset($_SESSION['csrf_tokens'][$token])) {
            $_SESSION['csrf_tokens'][$token]['used'] = true;
            $_SESSION['csrf_tokens'][$token]['used_at'] = time();
        }
    }
    
    /**
     * Set CSRF cookie
     */
    private function setCSRFCookie(string $token): void
    {
        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        $httpOnly = true;
        $sameSite = 'Strict';
        
        setcookie(
            $this->cookieName,
            $token,
            time() + $this->tokenLifetime,
            '/',
            '',
            $secure,
            $httpOnly
        );
    }
    
    /**
     * Clean up expired tokens
     */
    private function cleanupExpiredTokens(): void
    {
        if (!isset($_SESSION['csrf_tokens'])) {
            return;
        }
        
        $currentTime = time();
        foreach ($_SESSION['csrf_tokens'] as $token => $data) {
            if ($this->isTokenExpired($data['created'])) {
                unset($_SESSION['csrf_tokens'][$token]);
            }
        }
    }
    
    /**
     * Get client fingerprint
     */
    private function getClientFingerprint(): string
    {
        $components = [
            $this->getClientIP(),
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
        ];
        
        return hash('sha256', implode('|', $components));
    }
    
    /**
     * Validate client fingerprint
     */
    private function validateClientFingerprint(array $tokenData): bool
    {
        $stored = [
            'ip' => $tokenData['ip'] ?? '',
            'user_agent' => $tokenData['user_agent'] ?? ''
        ];
        
        $current = [
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ];
        
        // Allow for some flexibility in IP (proxy changes)
        $ipMatch = $stored['ip'] === $current['ip'] || 
                   $this->config->get('csrf.allow_ip_change', false);
        
        // User agent should match exactly
        $userAgentMatch = $stored['user_agent'] === $current['user_agent'];
        
        return $ipMatch && $userAgentMatch;
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
     * Get or create secret key for HMAC
     */
    private function getOrCreateSecretKey(): string
    {
        $keyFile = dirname(__DIR__, 3) . '/config/csrf_secret.key';
        
        if (file_exists($keyFile)) {
            return file_get_contents($keyFile);
        }
        
        // Generate new secret key
        $key = random_bytes(64);
        
        $dir = dirname($keyFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        file_put_contents($keyFile, $key, LOCK_EX);
        chmod($keyFile, 0600);
        
        return $key;
    }
    
    /**
     * Initialize session if not started
     */
    private function initializeSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_tokens'])) {
            $_SESSION['csrf_tokens'] = [];
        }
    }
    
    /**
     * Log CSRF violation
     */
    private function logViolation(string $reason): void
    {
        if ($this->logger) {
            $this->logger->warning('CSRF violation detected', [
                'reason' => $reason,
                'ip' => $this->getClientIP(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
            ]);
        }
    }
}

/**
 * CSRF Protection Exception
 */
class CSRFException extends \Exception
{
    
}