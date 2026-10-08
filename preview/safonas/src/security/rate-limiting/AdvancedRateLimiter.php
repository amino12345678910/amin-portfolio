<?php
/**
 * Advanced Rate Limiter with Progressive Delays and IP Tracking
 * Optimized for shared hosting environments
 * 
 * @package Safonas\Security\RateLimit
 * @version 1.0.0
 */

namespace Safonas\Security\RateLimit;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;

class AdvancedRateLimiter
{
    private $config;
    private $logger;
    private $storageFile;
    private $data = [];
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->storageFile = dirname(__DIR__, 3) . '/logs/rate_limits.json';
        $this->initializeStorage();
        $this->loadData();
    }
    
    /**
     * Check if request is within rate limits
     */
    public function checkLimit(string $identifier, string $action = 'default'): bool
    {
        $this->cleanupExpiredEntries();
        
        $key = $this->generateKey($identifier, $action);
        $config = $this->getActionConfig($action);
        $currentTime = time();
        
        // Initialize tracking if not exists
        if (!isset($this->data[$key])) {
            $this->data[$key] = [
                'requests' => [],
                'violations' => 0,
                'last_violation' => 0,
                'blocked_until' => 0,
                'progressive_delay' => 0,
                'created' => $currentTime
            ];
        }
        
        $entry = &$this->data[$key];
        
        // Check if currently blocked
        if ($entry['blocked_until'] > $currentTime) {
            $this->logViolation($identifier, $action, 'Blocked period active');
            return false;
        }
        
        // Apply progressive delay
        if ($entry['progressive_delay'] > $currentTime) {
            $this->logViolation($identifier, $action, 'Progressive delay active');
            return false;
        }
        
        // Clean old requests outside window
        $windowStart = $currentTime - $config['time_window'];
        $entry['requests'] = array_filter($entry['requests'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        // Check rate limit
        if (count($entry['requests']) >= $config['max_requests']) {
            return $this->handleViolation($identifier, $action, $entry);
        }
        
        // Check burst limit
        $burstWindow = 60; // 1 minute burst window
        $burstStart = $currentTime - $burstWindow;
        $recentRequests = array_filter($entry['requests'], function($timestamp) use ($burstStart) {
            return $timestamp > $burstStart;
        });
        
        if (count($recentRequests) >= $config['burst_limit']) {
            return $this->handleViolation($identifier, $action, $entry, 'Burst limit exceeded');
        }
        
        // Record successful request
        $entry['requests'][] = $currentTime;
        $this->saveData();
        
        return true;
    }
    
    /**
     * Handle rate limit violation
     */
    private function handleViolation(string $identifier, string $action, array &$entry, string $reason = 'Rate limit exceeded'): bool
    {
        $config = $this->getActionConfig($action);
        $currentTime = time();
        
        $entry['violations']++;
        $entry['last_violation'] = $currentTime;
        
        // Calculate progressive delay
        $delayIndex = min($entry['violations'] - 1, count($config['escalation_delays']) - 1);
        $delay = $config['escalation_delays'][$delayIndex] * 60; // Convert to seconds
        $entry['progressive_delay'] = $currentTime + $delay;
        
        // Check for escalation to blocking
        $thresholds = $config['escalation_thresholds'];
        foreach ($thresholds as $threshold) {
            if ($entry['violations'] >= $threshold) {
                $blockDuration = $config['block_duration'] * ($entry['violations'] - $threshold + 1);
                $entry['blocked_until'] = $currentTime + $blockDuration;
                break;
            }
        }
        
        $this->logViolation($identifier, $action, $reason, [
            'violations' => $entry['violations'],
            'progressive_delay' => $delay,
            'blocked_until' => $entry['blocked_until']
        ]);
        
        $this->saveData();
        return false;
    }
    
    /**
     * Get remaining time until request allowed
     */
    public function getTimeUntilAllowed(string $identifier, string $action = 'default'): int
    {
        $key = $this->generateKey($identifier, $action);
        $currentTime = time();
        
        if (!isset($this->data[$key])) {
            return 0;
        }
        
        $entry = $this->data[$key];
        
        // Check blocking period
        if ($entry['blocked_until'] > $currentTime) {
            return $entry['blocked_until'] - $currentTime;
        }
        
        // Check progressive delay
        if ($entry['progressive_delay'] > $currentTime) {
            return $entry['progressive_delay'] - $currentTime;
        }
        
        return 0;
    }
    
    /**
     * Get rate limit status for identifier
     */
    public function getStatus(string $identifier, string $action = 'default'): array
    {
        $key = $this->generateKey($identifier, $action);
        $config = $this->getActionConfig($action);
        $currentTime = time();
        
        if (!isset($this->data[$key])) {
            return [
                'allowed' => true,
                'remaining' => $config['max_requests'],
                'reset_time' => $currentTime + $config['time_window'],
                'violations' => 0,
                'blocked' => false,
                'progressive_delay' => 0
            ];
        }
        
        $entry = $this->data[$key];
        
        // Clean old requests
        $windowStart = $currentTime - $config['time_window'];
        $validRequests = array_filter($entry['requests'], function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        return [
            'allowed' => count($validRequests) < $config['max_requests'] && 
                        $entry['blocked_until'] <= $currentTime && 
                        $entry['progressive_delay'] <= $currentTime,
            'remaining' => max(0, $config['max_requests'] - count($validRequests)),
            'reset_time' => $currentTime + $config['time_window'],
            'violations' => $entry['violations'],
            'blocked' => $entry['blocked_until'] > $currentTime,
            'progressive_delay' => max(0, $entry['progressive_delay'] - $currentTime),
            'blocked_until' => $entry['blocked_until'],
            'total_requests' => count($validRequests)
        ];
    }
    
    /**
     * Reset rate limits for identifier
     */
    public function reset(string $identifier, string $action = 'default'): void
    {
        $key = $this->generateKey($identifier, $action);
        unset($this->data[$key]);
        $this->saveData();
        
        $this->logger->info("Rate limit reset for {$identifier}:{$action}");
    }
    
    /**
     * Add identifier to whitelist
     */
    public function addToWhitelist(string $identifier): void
    {
        $whitelist = $this->config->get('rate_limiting.whitelist', []);
        if (!in_array($identifier, $whitelist)) {
            $whitelist[] = $identifier;
            $this->config->set('rate_limiting.whitelist', $whitelist);
            $this->logger->info("Added {$identifier} to rate limit whitelist");
        }
    }
    
    /**
     * Remove identifier from whitelist
     */
    public function removeFromWhitelist(string $identifier): void
    {
        $whitelist = $this->config->get('rate_limiting.whitelist', []);
        $index = array_search($identifier, $whitelist);
        if ($index !== false) {
            unset($whitelist[$index]);
            $this->config->set('rate_limiting.whitelist', array_values($whitelist));
            $this->logger->info("Removed {$identifier} from rate limit whitelist");
        }
    }
    
    /**
     * Check if identifier is whitelisted
     */
    public function isWhitelisted(string $identifier): bool
    {
        $whitelist = $this->config->get('rate_limiting.whitelist', []);
        return in_array($identifier, $whitelist);
    }
    
    /**
     * Get rate limiting statistics
     */
    public function getStatistics(): array
    {
        $stats = [
            'total_identifiers' => count($this->data),
            'blocked_identifiers' => 0,
            'identifiers_with_violations' => 0,
            'total_violations' => 0,
            'active_delays' => 0
        ];
        
        $currentTime = time();
        
        foreach ($this->data as $entry) {
            if ($entry['blocked_until'] > $currentTime) {
                $stats['blocked_identifiers']++;
            }
            
            if ($entry['violations'] > 0) {
                $stats['identifiers_with_violations']++;
                $stats['total_violations'] += $entry['violations'];
            }
            
            if ($entry['progressive_delay'] > $currentTime) {
                $stats['active_delays']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Clean up expired entries
     */
    private function cleanupExpiredEntries(): void
    {
        $currentTime = time();
        $maxAge = 86400 * 7; // 7 days
        
        foreach ($this->data as $key => $entry) {
            // Remove entries that are old and have no active restrictions
            if ($entry['created'] < ($currentTime - $maxAge) && 
                $entry['blocked_until'] <= $currentTime && 
                $entry['progressive_delay'] <= $currentTime) {
                unset($this->data[$key]);
            }
        }
    }
    
    /**
     * Generate storage key
     */
    private function generateKey(string $identifier, string $action): string
    {
        return hash('sha256', $identifier . ':' . $action);
    }
    
    /**
     * Get configuration for specific action
     */
    private function getActionConfig(string $action): array
    {
        $baseConfig = $this->config->get('rate_limiting', []);
        
        // Action-specific configurations
        $actionConfigs = [
            'contact_form' => [
                'max_requests' => 3,
                'time_window' => 3600,
                'burst_limit' => 2,
                'block_duration' => 7200,
                'escalation_thresholds' => [2, 3, 5],
                'escalation_delays' => [5, 15, 60] // minutes
            ],
            'login' => [
                'max_requests' => 5,
                'time_window' => 900,
                'burst_limit' => 3,
                'block_duration' => 1800,
                'escalation_thresholds' => [3, 5, 8],
                'escalation_delays' => [2, 10, 30]
            ],
            'api' => [
                'max_requests' => 100,
                'time_window' => 3600,
                'burst_limit' => 20,
                'block_duration' => 3600,
                'escalation_thresholds' => [80, 120, 200],
                'escalation_delays' => [1, 5, 15]
            ]
        ];
        
        $actionConfig = $actionConfigs[$action] ?? [];
        
        return array_merge([
            'max_requests' => 10,
            'time_window' => 3600,
            'burst_limit' => 5,
            'block_duration' => 1800,
            'escalation_thresholds' => [5, 10, 20],
            'escalation_delays' => [1, 5, 15]
        ], $baseConfig, $actionConfig);
    }
    
    /**
     * Log rate limit violation
     */
    private function logViolation(string $identifier, string $action, string $reason, array $details = []): void
    {
        $this->logger->warning('Rate limit violation', array_merge([
            'identifier' => $identifier,
            'action' => $action,
            'reason' => $reason,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ], $details));
    }
    
    /**
     * Initialize storage directory
     */
    private function initializeStorage(): void
    {
        $dir = dirname($this->storageFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
    
    /**
     * Load data from storage
     */
    private function loadData(): void
    {
        if (file_exists($this->storageFile)) {
            try {
                $content = file_get_contents($this->storageFile);
                $data = json_decode($content, true);
                if (is_array($data)) {
                    $this->data = $data;
                }
            } catch (Exception $e) {
                $this->logger->error('Failed to load rate limit data', ['error' => $e->getMessage()]);
                $this->data = [];
            }
        }
    }
    
    /**
     * Save data to storage
     */
    private function saveData(): void
    {
        try {
            $content = json_encode($this->data, JSON_PRETTY_PRINT);
            file_put_contents($this->storageFile, $content, LOCK_EX);
        } catch (Exception $e) {
            $this->logger->error('Failed to save rate limit data', ['error' => $e->getMessage()]);
        }
    }
    
    /**
     * Get top violators
     */
    public function getTopViolators(int $limit = 10): array
    {
        $violators = [];
        
        foreach ($this->data as $key => $entry) {
            if ($entry['violations'] > 0) {
                $violators[] = [
                    'key' => $key,
                    'violations' => $entry['violations'],
                    'last_violation' => $entry['last_violation'],
                    'blocked_until' => $entry['blocked_until']
                ];
            }
        }
        
        // Sort by violations descending
        usort($violators, function($a, $b) {
            return $b['violations'] - $a['violations'];
        });
        
        return array_slice($violators, 0, $limit);
    }
    
    /**
     * Export rate limit data for analysis
     */
    public function exportData(): array
    {
        return [
            'export_time' => date('c'),
            'total_entries' => count($this->data),
            'data' => $this->data,
            'statistics' => $this->getStatistics()
        ];
    }
}