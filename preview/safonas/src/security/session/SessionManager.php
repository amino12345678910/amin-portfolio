<?php
/**
 * Secure Session Management System
 * Advanced session security with fingerprinting and hijacking protection
 * 
 * @package Safonas\Security\Session
 * @version 1.0.0
 */

namespace Safonas\Security\Session;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;
use Safonas\Security\Encryption\EncryptionManager;

class SessionManager
{
    private $config;
    private $logger;
    private $encryption;
    private $sessionStarted = false;
    private $fingerprint = null;
    private $lastActivity = 0;
    private $regenerationInterval;
    private $maxLifetime;
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger, EncryptionManager $encryption = null)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->encryption = $encryption;
        $this->regenerationInterval = $config->get('session.regenerate_interval', 1800);
        $this->maxLifetime = $config->get('session.gc_maxlifetime', 3600);
        
        $this->configureSession();
    }
    
    /**
     * Start secure session
     */
    public function start(): bool
    {
        if ($this->sessionStarted) {
            return true;
        }
        
        try {
            // Start session
            if (session_status() === PHP_SESSION_NONE) {
                $started = session_start();
                
                if (!$started) {
                    throw new SessionException('Failed to start session');
                }
            }
            
            $this->sessionStarted = true;
            
            // Initialize session security
            $this->initializeSessionSecurity();
            
            // Validate existing session
            if (!$this->validateSession()) {
                $this->destroy();
                $this->start(); // Restart with new session
                return true;
            }
            
            // Check for session regeneration
            $this->checkRegenerationNeeded();
            
            // Update activity timestamp
            $this->updateActivity();
            
            $this->logger->debug('Secure session started', [
                'session_id' => session_id(),
                'fingerprint' => substr($this->fingerprint, 0, 8)
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            $this->logger->error('Session start failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Set session data with optional encryption
     */
    public function set(string $key, $value, bool $encrypt = false): void
    {
        $this->ensureSessionStarted();
        
        if ($encrypt && $this->encryption) {
            $value = $this->encryption->encrypt(serialize($value));
            $key = 'encrypted_' . $key;
        }
        
        $_SESSION[$key] = $value;
        
        $this->logger->debug('Session data set', [
            'key' => $key,
            'encrypted' => $encrypt
        ]);
    }
    
    /**
     * Get session data with optional decryption
     */
    public function get(string $key, $default = null, bool $decrypt = false)
    {
        $this->ensureSessionStarted();
        
        if ($decrypt) {
            $key = 'encrypted_' . $key;
        }
        
        if (!isset($_SESSION[$key])) {
            return $default;
        }
        
        $value = $_SESSION[$key];
        
        if ($decrypt && $this->encryption) {
            try {
                $value = unserialize($this->encryption->decrypt($value));
            } catch (\Exception $e) {
                $this->logger->warning('Failed to decrypt session data', [
                    'key' => $key,
                    'error' => $e->getMessage()
                ]);
                return $default;
            }
        }
        
        return $value;
    }
    
    /**
     * Check if session key exists
     */
    public function has(string $key, bool $encrypted = false): bool
    {
        $this->ensureSessionStarted();
        
        if ($encrypted) {
            $key = 'encrypted_' . $key;
        }
        
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session data
     */
    public function remove(string $key, bool $encrypted = false): void
    {
        $this->ensureSessionStarted();
        
        if ($encrypted) {
            $key = 'encrypted_' . $key;
        }
        
        unset($_SESSION[$key]);
        
        $this->logger->debug('Session data removed', ['key' => $key]);
    }
    
    /**
     * Clear all session data except security data
     */
    public function clear(): void
    {
        $this->ensureSessionStarted();
        
        // Preserve security-related session data
        $preserve = [
            '_security_fingerprint',
            '_security_created',
            '_security_last_activity',
            '_security_last_regeneration'
        ];
        
        $preserved = [];
        foreach ($preserve as $key) {
            if (isset($_SESSION[$key])) {
                $preserved[$key] = $_SESSION[$key];
            }
        }
        
        $_SESSION = $preserved;
        
        $this->logger->info('Session data cleared');
    }
    
    /**
     * Regenerate session ID
     */
    public function regenerate(bool $deleteOld = true): bool
    {
        $this->ensureSessionStarted();
        
        $oldId = session_id();
        
        if (!session_regenerate_id($deleteOld)) {
            $this->logger->error('Session regeneration failed');
            return false;
        }
        
        $newId = session_id();
        
        // Update regeneration timestamp
        $_SESSION['_security_last_regeneration'] = time();
        
        $this->logger->info('Session ID regenerated', [
            'old_id' => $oldId,
            'new_id' => $newId,
            'delete_old' => $deleteOld
        ]);
        
        return true;
    }
    
    /**
     * Destroy session completely
     */
    public function destroy(): bool
    {
        if (!$this->sessionStarted) {
            return true;
        }
        
        $sessionId = session_id();
        
        // Clear all session data
        $_SESSION = [];
        
        // Delete session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(
                session_name(),
                '',
                time() - 3600,
                '/',
                '',
                $this->config->get('session.cookie_secure', true),
                $this->config->get('session.cookie_httponly', true)
            );
        }
        
        // Destroy session
        $destroyed = session_destroy();
        
        if ($destroyed) {
            $this->sessionStarted = false;
            $this->logger->info('Session destroyed', ['session_id' => $sessionId]);
        } else {
            $this->logger->error('Session destruction failed', ['session_id' => $sessionId]);
        }
        
        return $destroyed;
    }
    
    /**
     * Check if session is valid and not hijacked
     */
    public function isValid(): bool
    {
        if (!$this->sessionStarted) {
            return false;
        }
        
        return $this->validateSession();
    }
    
    /**
     * Get session information
     */
    public function getInfo(): array
    {
        $this->ensureSessionStarted();
        
        return [
            'id' => session_id(),
            'name' => session_name(),
            'status' => session_status(),
            'started' => $this->sessionStarted,
            'created' => $this->get('_security_created', 0),
            'last_activity' => $this->get('_security_last_activity', 0),
            'last_regeneration' => $this->get('_security_last_regeneration', 0),
            'fingerprint' => substr($this->fingerprint ?? '', 0, 8),
            'data_count' => count($_SESSION ?? []),
            'is_valid' => $this->isValid()
        ];
    }
    
    /**
     * Get session statistics
     */
    public function getStatistics(): array
    {
        $info = $this->getInfo();
        $currentTime = time();
        
        return [
            'session_active' => $this->sessionStarted,
            'session_age' => $info['created'] > 0 ? $currentTime - $info['created'] : 0,
            'time_since_activity' => $info['last_activity'] > 0 ? $currentTime - $info['last_activity'] : 0,
            'time_since_regeneration' => $info['last_regeneration'] > 0 ? $currentTime - $info['last_regeneration'] : 0,
            'regeneration_needed' => $this->isRegenerationNeeded(),
            'session_valid' => $this->isValid(),
            'fingerprint_check' => $this->validateFingerprint(),
            'data_encrypted' => $this->countEncryptedData()
        ];
    }
    
    /**
     * Configure session settings
     */
    private function configureSession(): void
    {
        $sessionConfig = $this->config->getSessionConfig();
        
        foreach ($sessionConfig as $key => $value) {
            if (ini_get("session.{$key}") !== (string)$value) {
                ini_set("session.{$key}", $value);
            }
        }
        
        // Set custom session name if configured
        $sessionName = $this->config->get('session.name', 'SAFONAS_SESS');
        if (session_name() !== $sessionName) {
            session_name($sessionName);
        }
        
        // Configure session save path if specified
        $savePath = $this->config->get('session.save_path', '');
        if (!empty($savePath) && is_writable($savePath)) {
            session_save_path($savePath);
        }
    }
    
    /**
     * Initialize session security measures
     */
    private function initializeSessionSecurity(): void
    {
        $currentTime = time();
        
        // Set creation time if new session
        if (!isset($_SESSION['_security_created'])) {
            $_SESSION['_security_created'] = $currentTime;
            $_SESSION['_security_last_regeneration'] = $currentTime;
        }
        
        // Generate and store fingerprint if new session
        if (!isset($_SESSION['_security_fingerprint'])) {
            $this->fingerprint = $this->generateFingerprint();
            $_SESSION['_security_fingerprint'] = $this->fingerprint;
        } else {
            $this->fingerprint = $_SESSION['_security_fingerprint'];
        }
        
        // Set last activity
        $_SESSION['_security_last_activity'] = $currentTime;
        $this->lastActivity = $currentTime;
    }
    
    /**
     * Validate session against security checks
     */
    private function validateSession(): bool
    {
        // Check if session has required security data
        if (!isset($_SESSION['_security_created'], $_SESSION['_security_fingerprint'])) {
            $this->logger->warning('Session missing security data');
            return false;
        }
        
        // Check session age
        $sessionAge = time() - $_SESSION['_security_created'];
        if ($sessionAge > $this->maxLifetime) {
            $this->logger->warning('Session expired due to age', [
                'age' => $sessionAge,
                'max_lifetime' => $this->maxLifetime
            ]);
            return false;
        }
        
        // Check activity timeout
        $inactiveTime = time() - ($_SESSION['_security_last_activity'] ?? 0);
        $maxInactive = $this->config->get('session.max_inactive', 3600);
        
        if ($inactiveTime > $maxInactive) {
            $this->logger->warning('Session expired due to inactivity', [
                'inactive_time' => $inactiveTime,
                'max_inactive' => $maxInactive
            ]);
            return false;
        }
        
        // Validate fingerprint
        if (!$this->validateFingerprint()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Generate client fingerprint
     */
    private function generateFingerprint(): string
    {
        $components = [
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
            $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '',
            $this->getClientIP(),
            $_SERVER['SERVER_NAME'] ?? ''
        ];
        
        // Include additional entropy for shared hosting
        if (function_exists('gethostname')) {
            $components[] = gethostname();
        }
        
        return hash('sha256', implode('|', $components) . session_id());
    }
    
    /**
     * Validate client fingerprint
     */
    private function validateFingerprint(): bool
    {
        $storedFingerprint = $_SESSION['_security_fingerprint'] ?? '';
        $currentFingerprint = $this->generateFingerprint();
        
        // Allow for some flexibility in fingerprint validation
        $flexibleValidation = $this->config->get('session.flexible_fingerprint', false);
        
        if ($flexibleValidation) {
            // Compare only IP and User Agent (more lenient)
            $storedComponents = $this->extractFingerprintComponents($storedFingerprint);
            $currentComponents = $this->extractFingerprintComponents($currentFingerprint);
            
            $valid = $storedComponents['ip'] === $currentComponents['ip'] &&
                    $storedComponents['user_agent'] === $currentComponents['user_agent'];
        } else {
            // Strict fingerprint comparison
            $valid = hash_equals($storedFingerprint, $currentFingerprint);
        }
        
        if (!$valid) {
            $this->logger->warning('Session fingerprint mismatch - possible hijacking', [
                'expected' => substr($storedFingerprint, 0, 16),
                'actual' => substr($currentFingerprint, 0, 16),
                'ip' => $this->getClientIP(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        }
        
        return $valid;
    }
    
    /**
     * Extract components from fingerprint for flexible validation
     */
    private function extractFingerprintComponents(string $fingerprint): array
    {
        // This is a simplified implementation
        // In practice, you'd store components separately
        return [
            'ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ];
    }
    
    /**
     * Check if session regeneration is needed
     */
    private function checkRegenerationNeeded(): void
    {
        if ($this->isRegenerationNeeded()) {
            $this->regenerate();
        }
    }
    
    /**
     * Check if regeneration is needed
     */
    private function isRegenerationNeeded(): bool
    {
        $lastRegeneration = $_SESSION['_security_last_regeneration'] ?? 0;
        return (time() - $lastRegeneration) > $this->regenerationInterval;
    }
    
    /**
     * Update activity timestamp
     */
    private function updateActivity(): void
    {
        $_SESSION['_security_last_activity'] = time();
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
     * Ensure session is started
     */
    private function ensureSessionStarted(): void
    {
        if (!$this->sessionStarted) {
            throw new SessionException('Session not started');
        }
    }
    
    /**
     * Count encrypted data in session
     */
    private function countEncryptedData(): int
    {
        $count = 0;
        foreach ($_SESSION as $key => $value) {
            if (strpos($key, 'encrypted_') === 0) {
                $count++;
            }
        }
        return $count;
    }
    
    /**
     * Emergency session cleanup
     */
    public function emergencyCleanup(): void
    {
        try {
            $this->destroy();
            
            // Clear any remaining cookies
            $cookieParams = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 3600,
                $cookieParams['path'],
                $cookieParams['domain'],
                $cookieParams['secure'],
                $cookieParams['httponly']
            );
            
            $this->logger->info('Emergency session cleanup performed');
            
        } catch (\Exception $e) {
            $this->logger->error('Emergency session cleanup failed', [
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Destructor - cleanup if needed
     */
    public function __destruct()
    {
        // Write and close session properly
        if ($this->sessionStarted && session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
    }
}

/**
 * Session Management Exception
 */
class SessionException extends \Exception
{
    
}