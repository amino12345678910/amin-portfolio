<?php
/**
 * Advanced Encryption Manager for Sensitive Data
 * AES-256-GCM with key rotation and secure storage
 * 
 * @package Safonas\Security\Encryption
 * @version 1.0.0
 */

namespace Safonas\Security\Encryption;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;

class EncryptionManager
{
    private $config;
    private $logger;
    private $algorithm = 'AES-256-GCM';
    private $keyFile;
    private $currentKey = null;
    private $keyRotationTime = 86400; // 24 hours
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger = null)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->algorithm = $config->get('encryption.method', 'AES-256-GCM');
        $this->keyFile = dirname(__DIR__, 3) . '/config/encryption_keys.json';
        $this->keyRotationTime = $config->get('encryption.key_lifetime', 86400);
        
        $this->initializeKeyStorage();
        $this->loadOrGenerateKey();
    }
    
    /**
     * Encrypt sensitive data
     */
    public function encrypt(string $data, array $options = []): string
    {
        if (empty($data)) {
            return '';
        }
        
        try {
            $key = $this->getCurrentKey();
            $iv = random_bytes(16); // 128-bit IV for AES
            $tag = '';
            
            // Use additional authenticated data if provided
            $aad = $options['aad'] ?? '';
            
            // Encrypt the data
            $encrypted = openssl_encrypt(
                $data,
                $this->algorithm,
                $key,
                OPENSSL_RAW_DATA,
                $iv,
                $tag,
                $aad
            );
            
            if ($encrypted === false) {
                throw new EncryptionException('Encryption failed');
            }
            
            // Combine all components
            $result = [
                'algorithm' => $this->algorithm,
                'iv' => base64_encode($iv),
                'tag' => base64_encode($tag),
                'data' => base64_encode($encrypted),
                'key_id' => $this->getCurrentKeyId(),
                'timestamp' => time()
            ];
            
            if (!empty($aad)) {
                $result['aad'] = base64_encode($aad);
            }
            
            $encoded = base64_encode(json_encode($result));
            
            if ($this->logger) {
                $this->logger->debug('Data encrypted successfully', [
                    'data_length' => strlen($data),
                    'key_id' => $this->getCurrentKeyId()
                ]);
            }
            
            return $encoded;
            
        } catch (Exception $e) {
            if ($this->logger) {
                $this->logger->error('Encryption failed', ['error' => $e->getMessage()]);
            }
            throw new EncryptionException('Encryption failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Decrypt sensitive data
     */
    public function decrypt(string $encryptedData): string
    {
        if (empty($encryptedData)) {
            return '';
        }
        
        try {
            // Decode the encrypted package
            $package = json_decode(base64_decode($encryptedData), true);
            
            if (!is_array($package) || !isset($package['data'], $package['iv'], $package['tag'], $package['key_id'])) {
                throw new EncryptionException('Invalid encrypted data format');
            }
            
            // Get the key used for encryption
            $key = $this->getKeyById($package['key_id']);
            if (!$key) {
                throw new EncryptionException('Encryption key not found');
            }
            
            // Extract components
            $algorithm = $package['algorithm'] ?? $this->algorithm;
            $iv = base64_decode($package['iv']);
            $tag = base64_decode($package['tag']);
            $data = base64_decode($package['data']);
            $aad = isset($package['aad']) ? base64_decode($package['aad']) : '';
            
            // Decrypt the data
            $decrypted = openssl_decrypt(
                $data,
                $algorithm,
                $key,
                OPENSSL_RAW_DATA,
                $iv,
                $tag,
                $aad
            );
            
            if ($decrypted === false) {
                throw new EncryptionException('Decryption failed');
            }
            
            if ($this->logger) {
                $this->logger->debug('Data decrypted successfully', [
                    'key_id' => $package['key_id'],
                    'data_length' => strlen($decrypted)
                ]);
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            if ($this->logger) {
                $this->logger->error('Decryption failed', ['error' => $e->getMessage()]);
            }
            throw new EncryptionException('Decryption failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Hash password securely
     */
    public function hashPassword(string $password): string
    {
        $cost = $this->config->get('security.bcrypt_cost', 12);
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $cost]);
        
        if ($hash === false) {
            throw new EncryptionException('Password hashing failed');
        }
        
        return $hash;
    }
    
    /**
     * Verify password against hash
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
    
    /**
     * Generate secure random token
     */
    public function generateToken(int $length = 32): string
    {
        if (function_exists('random_bytes')) {
            return bin2hex(random_bytes($length));
        } elseif (function_exists('openssl_random_pseudo_bytes')) {
            $bytes = openssl_random_pseudo_bytes($length, $strong);
            if (!$strong) {
                throw new EncryptionException('Could not generate cryptographically strong random bytes');
            }
            return bin2hex($bytes);
        } else {
            throw new EncryptionException('No secure random number generator available');
        }
    }
    
    /**
     * Generate HMAC for data integrity
     */
    public function generateHmac(string $data, string $key = null): string
    {
        $key = $key ?? $this->getCurrentKey();
        return hash_hmac('sha256', $data, $key);
    }
    
    /**
     * Verify HMAC
     */
    public function verifyHmac(string $data, string $hmac, string $key = null): bool
    {
        $key = $key ?? $this->getCurrentKey();
        $calculatedHmac = hash_hmac('sha256', $data, $key);
        return hash_equals($hmac, $calculatedHmac);
    }
    
    /**
     * Encrypt sensitive form data
     */
    public function encryptFormData(array $data, array $sensitiveFields = []): array
    {
        $encrypted = $data;
        
        $defaultSensitive = ['password', 'email', 'phone', 'ssn', 'credit_card'];
        $toEncrypt = array_merge($defaultSensitive, $sensitiveFields);
        
        foreach ($toEncrypt as $field) {
            if (isset($encrypted[$field]) && !empty($encrypted[$field])) {
                $encrypted[$field] = $this->encrypt($encrypted[$field]);
            }
        }
        
        return $encrypted;
    }
    
    /**
     * Decrypt sensitive form data
     */
    public function decryptFormData(array $data, array $sensitiveFields = []): array
    {
        $decrypted = $data;
        
        $defaultSensitive = ['password', 'email', 'phone', 'ssn', 'credit_card'];
        $toDecrypt = array_merge($defaultSensitive, $sensitiveFields);
        
        foreach ($toDecrypt as $field) {
            if (isset($decrypted[$field]) && !empty($decrypted[$field])) {
                try {
                    $decrypted[$field] = $this->decrypt($decrypted[$field]);
                } catch (EncryptionException $e) {
                    // Field might not be encrypted, leave as is
                }
            }
        }
        
        return $decrypted;
    }
    
    /**
     * Rotate encryption keys
     */
    public function rotateKeys(): void
    {
        try {
            $newKey = $this->generateEncryptionKey();
            $keyId = $this->generateKeyId();
            
            $keyData = $this->loadKeyData();
            
            // Add new key
            $keyData['keys'][$keyId] = [
                'key' => base64_encode($newKey),
                'created' => time(),
                'status' => 'active'
            ];
            
            // Mark old current key as deprecated
            if (isset($keyData['current_key'])) {
                $oldKeyId = $keyData['current_key'];
                if (isset($keyData['keys'][$oldKeyId])) {
                    $keyData['keys'][$oldKeyId]['status'] = 'deprecated';
                    $keyData['keys'][$oldKeyId]['deprecated'] = time();
                }
            }
            
            // Set new current key
            $keyData['current_key'] = $keyId;
            $keyData['last_rotation'] = time();
            
            $this->saveKeyData($keyData);
            $this->currentKey = $newKey;
            
            if ($this->logger) {
                $this->logger->info('Encryption keys rotated successfully', ['new_key_id' => $keyId]);
            }
            
        } catch (Exception $e) {
            if ($this->logger) {
                $this->logger->error('Key rotation failed', ['error' => $e->getMessage()]);
            }
            throw new EncryptionException('Key rotation failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if key rotation is needed
     */
    public function isKeyRotationNeeded(): bool
    {
        $keyData = $this->loadKeyData();
        $lastRotation = $keyData['last_rotation'] ?? 0;
        
        return (time() - $lastRotation) > $this->keyRotationTime;
    }
    
    /**
     * Clean up old keys
     */
    public function cleanupOldKeys(): void
    {
        $keyData = $this->loadKeyData();
        $maxAge = $this->config->get('encryption.key_retention', 86400 * 30); // 30 days
        $currentTime = time();
        
        foreach ($keyData['keys'] as $keyId => $keyInfo) {
            if ($keyInfo['status'] === 'deprecated' && 
                isset($keyInfo['deprecated']) && 
                ($currentTime - $keyInfo['deprecated']) > $maxAge) {
                
                unset($keyData['keys'][$keyId]);
                
                if ($this->logger) {
                    $this->logger->info('Old encryption key cleaned up', ['key_id' => $keyId]);
                }
            }
        }
        
        $this->saveKeyData($keyData);
    }
    
    /**
     * Get encryption statistics
     */
    public function getStatistics(): array
    {
        $keyData = $this->loadKeyData();
        
        $stats = [
            'algorithm' => $this->algorithm,
            'current_key_id' => $keyData['current_key'] ?? null,
            'total_keys' => count($keyData['keys'] ?? []),
            'last_rotation' => $keyData['last_rotation'] ?? 0,
            'rotation_needed' => $this->isKeyRotationNeeded(),
            'available' => $this->isAvailable()
        ];
        
        // Count keys by status
        $statusCounts = [];
        foreach ($keyData['keys'] ?? [] as $keyInfo) {
            $status = $keyInfo['status'] ?? 'unknown';
            $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;
        }
        $stats['key_status_counts'] = $statusCounts;
        
        return $stats;
    }
    
    /**
     * Check if encryption is available
     */
    public function isAvailable(): bool
    {
        return function_exists('openssl_encrypt') && 
               function_exists('openssl_decrypt') && 
               in_array($this->algorithm, openssl_get_cipher_methods());
    }
    
    /**
     * Initialize key storage
     */
    private function initializeKeyStorage(): void
    {
        $dir = dirname($this->keyFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Set restrictive permissions on key file
        if (file_exists($this->keyFile)) {
            chmod($this->keyFile, 0600);
        }
    }
    
    /**
     * Load or generate encryption key
     */
    private function loadOrGenerateKey(): void
    {
        $keyData = $this->loadKeyData();
        
        if (empty($keyData['current_key']) || empty($keyData['keys'])) {
            // Generate initial key
            $this->generateInitialKey();
        } else {
            // Load current key
            $currentKeyId = $keyData['current_key'];
            if (isset($keyData['keys'][$currentKeyId])) {
                $this->currentKey = base64_decode($keyData['keys'][$currentKeyId]['key']);
            } else {
                $this->generateInitialKey();
            }
        }
        
        // Check if rotation is needed
        if ($this->isKeyRotationNeeded()) {
            $this->rotateKeys();
        }
    }
    
    /**
     * Generate initial encryption key
     */
    private function generateInitialKey(): void
    {
        $key = $this->generateEncryptionKey();
        $keyId = $this->generateKeyId();
        
        $keyData = [
            'current_key' => $keyId,
            'keys' => [
                $keyId => [
                    'key' => base64_encode($key),
                    'created' => time(),
                    'status' => 'active'
                ]
            ],
            'last_rotation' => time(),
            'algorithm' => $this->algorithm
        ];
        
        $this->saveKeyData($keyData);
        $this->currentKey = $key;
        
        if ($this->logger) {
            $this->logger->info('Initial encryption key generated', ['key_id' => $keyId]);
        }
    }
    
    /**
     * Generate encryption key
     */
    private function generateEncryptionKey(): string
    {
        $keyLength = $this->config->get('encryption.key_length', 32);
        return random_bytes($keyLength);
    }
    
    /**
     * Generate key ID
     */
    private function generateKeyId(): string
    {
        return hash('sha256', random_bytes(32) . time());
    }
    
    /**
     * Get current encryption key
     */
    private function getCurrentKey(): string
    {
        if (!$this->currentKey) {
            throw new EncryptionException('No encryption key available');
        }
        return $this->currentKey;
    }
    
    /**
     * Get current key ID
     */
    private function getCurrentKeyId(): string
    {
        $keyData = $this->loadKeyData();
        return $keyData['current_key'] ?? '';
    }
    
    /**
     * Get key by ID
     */
    private function getKeyById(string $keyId): ?string
    {
        $keyData = $this->loadKeyData();
        
        if (isset($keyData['keys'][$keyId])) {
            return base64_decode($keyData['keys'][$keyId]['key']);
        }
        
        return null;
    }
    
    /**
     * Load key data from storage
     */
    private function loadKeyData(): array
    {
        if (!file_exists($this->keyFile)) {
            return [];
        }
        
        $content = file_get_contents($this->keyFile);
        $data = json_decode($content, true);
        
        return is_array($data) ? $data : [];
    }
    
    /**
     * Save key data to storage
     */
    private function saveKeyData(array $keyData): void
    {
        $content = json_encode($keyData, JSON_PRETTY_PRINT);
        
        if (file_put_contents($this->keyFile, $content, LOCK_EX) === false) {
            throw new EncryptionException('Failed to save encryption keys');
        }
        
        // Set restrictive permissions
        chmod($this->keyFile, 0600);
    }
}

/**
 * Custom Encryption Exception
 */
class EncryptionException extends \Exception
{
    
}