<?php
/**
 * Web Application Firewall (WAF) Implementation
 * Advanced threat detection and blocking for shared hosting
 * 
 * @package Safonas\Security\WAF
 * @version 1.0.0
 */

namespace Safonas\Security\WAF;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;

class WebApplicationFirewall
{
    private $config;
    private $logger;
    private $threatLevel = 0;
    private $blockedReasons = [];
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger)
    {
        $this->config = $config;
        $this->logger = $logger;
    }
    
    /**
     * Analyze incoming request for threats
     */
    public function analyzeRequest(): array
    {
        $this->threatLevel = 0;
        $this->blockedReasons = [];
        
        $analysis = [
            'blocked' => false,
            'threat_level' => 0,
            'reasons' => [],
            'recommendations' => []
        ];
        
        // Check IP reputation
        $this->checkIPReputation();
        
        // Analyze HTTP headers
        $this->analyzeHeaders();
        
        // Check user agent
        $this->analyzeUserAgent();
        
        // Analyze request patterns
        $this->analyzeRequestPatterns();
        
        // Check for common attack vectors
        $this->checkAttackVectors();
        
        // Geolocation check
        $this->checkGeolocation();
        
        // Rate limiting integration
        $this->checkRateLimits();
        
        // Build final analysis
        $analysis['threat_level'] = $this->threatLevel;
        $analysis['reasons'] = $this->blockedReasons;
        $analysis['blocked'] = $this->shouldBlock();
        
        if ($analysis['blocked']) {
            $this->logger->warning('WAF blocked request', [
                'ip' => $this->getClientIP(),
                'threat_level' => $this->threatLevel,
                'reasons' => $this->blockedReasons,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]);
        }
        
        return $analysis;
    }
    
    /**
     * Check IP reputation and blacklists
     */
    private function checkIPReputation(): void
    {
        $clientIP = $this->getClientIP();
        
        // Check local blacklist
        $blacklist = $this->config->get('ip_control.blacklist', []);
        if (in_array($clientIP, $blacklist)) {
            $this->threatLevel += 100;
            $this->blockedReasons[] = 'IP in blacklist';
            return;
        }
        
        // Check for known bot patterns
        $botPatterns = [
            '/bot|crawler|spider|scraper/i',
            '/curl|wget|python|java|perl/i',
            '/scan|attack|hack|exploit/i'
        ];
        
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        foreach ($botPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                $this->threatLevel += 20;
                $this->blockedReasons[] = 'Suspicious user agent pattern';
                break;
            }
        }
        
        // Check for proxy/VPN indicators
        $proxyHeaders = [
            'HTTP_VIA',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_PROXY_CONNECTION',
            'HTTP_X_PROXY_ID'
        ];
        
        $proxyCount = 0;
        foreach ($proxyHeaders as $header) {
            if (isset($_SERVER[$header])) {
                $proxyCount++;
            }
        }
        
        if ($proxyCount >= 2) {
            $this->threatLevel += 10;
            $this->blockedReasons[] = 'Multiple proxy indicators';
        }
    }
    
    /**
     * Analyze HTTP headers for anomalies
     */
    private function analyzeHeaders(): void
    {
        $suspiciousHeaders = [
            'X-Forwarded-Host',
            'X-Originating-IP',
            'X-Remote-IP',
            'X-Client-IP'
        ];
        
        foreach ($suspiciousHeaders as $header) {
            if (isset($_SERVER['HTTP_' . str_replace('-', '_', strtoupper($header))])) {
                $this->threatLevel += 5;
            }
        }
        
        // Check for header injection attempts
        $allHeaders = getallheaders() ?: [];
        foreach ($allHeaders as $name => $value) {
            if (preg_match('/[\r\n]/', $value)) {
                $this->threatLevel += 50;
                $this->blockedReasons[] = 'HTTP header injection attempt';
            }
        }
        
        // Check Accept header for unusual values
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        if (empty($accept) || $accept === '*/*') {
            $this->threatLevel += 5;
        }
        
        // Check for missing common headers
        $commonHeaders = ['HTTP_USER_AGENT', 'HTTP_ACCEPT', 'HTTP_ACCEPT_LANGUAGE'];
        $missingCount = 0;
        foreach ($commonHeaders as $header) {
            if (empty($_SERVER[$header])) {
                $missingCount++;
            }
        }
        
        if ($missingCount >= 2) {
            $this->threatLevel += 15;
            $this->blockedReasons[] = 'Missing common HTTP headers';
        }
    }
    
    /**
     * Analyze user agent string
     */
    private function analyzeUserAgent(): void
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (empty($userAgent)) {
            $this->threatLevel += 25;
            $this->blockedReasons[] = 'Empty user agent';
            return;
        }
        
        // Check for suspicious patterns
        $suspiciousPatterns = [
            '/nikto|nmap|sqlmap|w3af|burp|owasp/i',
            '/\b(test|scanner|security|hack|exploit)\b/i',
            '/python-requests|curl|wget/i',
            '/\b\d+\.\d+\.\d+\b.*\b\d+\.\d+\.\d+\b/i' // IP addresses in UA
        ];
        
        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                $this->threatLevel += 30;
                $this->blockedReasons[] = 'Suspicious user agent content';
                break;
            }
        }
        
        // Check user agent length
        if (strlen($userAgent) < 20 || strlen($userAgent) > 400) {
            $this->threatLevel += 10;
        }
        
        // Check for unusual characters
        if (preg_match('/[^\x20-\x7E]/', $userAgent)) {
            $this->threatLevel += 15;
            $this->blockedReasons[] = 'Non-printable characters in user agent';
        }
    }
    
    /**
     * Analyze request patterns
     */
    private function analyzeRequestPatterns(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $queryString = $_SERVER['QUERY_STRING'] ?? '';
        
        // Check for suspicious URI patterns
        $suspiciousUriPatterns = [
            '/\.\.\//',                    // Path traversal
            '/\.(php|asp|jsp|cgi)$/i',     // Script file access
            '/\/(admin|wp-admin|login|phpmyadmin)/i', // Admin areas
            '/\.(log|txt|conf|ini)$/i',    // Config files
            '/%[0-9a-f]{2}/i',            // URL encoding
            '/[<>"\']/',                   // XSS characters
            '/union.*select/i',            // SQL injection
            '/script.*\(/i'                // JavaScript
        ];
        
        foreach ($suspiciousUriPatterns as $pattern) {
            if (preg_match($pattern, $uri . $queryString)) {
                $this->threatLevel += 25;
                $this->blockedReasons[] = 'Suspicious URI pattern';
                break;
            }
        }
        
        // Check request method
        $allowedMethods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
        if (!in_array($method, $allowedMethods)) {
            $this->threatLevel += 20;
            $this->blockedReasons[] = 'Unusual HTTP method';
        }
        
        // Check for multiple parameters (potential parameter pollution)
        if (substr_count($queryString, '&') > 20) {
            $this->threatLevel += 15;
            $this->blockedReasons[] = 'Excessive query parameters';
        }
    }
    
    /**
     * Check for common attack vectors
     */
    private function checkAttackVectors(): void
    {
        $allInput = array_merge(
            $_GET ?? [],
            $_POST ?? [],
            $_COOKIE ?? []
        );
        
        $inputString = strtolower(implode(' ', array_map('strval', $allInput)));
        
        $threatPatterns = $this->config->getThreatPatterns();
        
        foreach ($threatPatterns as $type => $pattern) {
            if (preg_match($pattern, $inputString)) {
                $this->threatLevel += 40;
                $this->blockedReasons[] = "Attack vector detected: {$type}";
            }
        }
        
        // Check for payload size attacks
        $totalSize = 0;
        foreach ($allInput as $value) {
            if (is_string($value)) {
                $totalSize += strlen($value);
            }
        }
        
        $maxSize = $this->config->get('security.max_input_length', 65536);
        if ($totalSize > $maxSize) {
            $this->threatLevel += 30;
            $this->blockedReasons[] = 'Input size exceeds limit';
        }
    }
    
    /**
     * Check geolocation restrictions
     */
    private function checkGeolocation(): void
    {
        if (!$this->config->get('waf.geoblocking', false)) {
            return;
        }
        
        $allowedCountries = $this->config->get('waf.allowed_countries', []);
        if (empty($allowedCountries)) {
            return;
        }
        
        // Simple IP-based country detection (limited on shared hosting)
        $clientIP = $this->getClientIP();
        
        // For demo purposes, we'll use basic IP range checks
        // In production, you'd use a geolocation service
        $country = $this->getCountryFromIP($clientIP);
        
        if ($country && !in_array($country, $allowedCountries)) {
            $this->threatLevel += 50;
            $this->blockedReasons[] = "Geographic restriction: {$country}";
        }
    }
    
    /**
     * Check rate limiting integration
     */
    private function checkRateLimits(): void
    {
        $clientIP = $this->getClientIP();
        $rateLimitKey = "waf_rate_limit_{$clientIP}";
        
        // Simple rate limiting check (would integrate with RateLimiter class)
        $requestsInWindow = $this->getRequestCount($clientIP);
        $maxRequests = $this->config->get('rate_limiting.max_requests', 100);
        
        if ($requestsInWindow > $maxRequests) {
            $this->threatLevel += 60;
            $this->blockedReasons[] = 'Rate limit exceeded';
        }
    }
    
    /**
     * Determine if request should be blocked
     */
    private function shouldBlock(): bool
    {
        $threshold = $this->config->get('waf.block_threshold', 75);
        return $this->threatLevel >= $threshold;
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
     * Simple country detection from IP (basic implementation)
     */
    private function getCountryFromIP(string $ip): ?string
    {
        // This is a basic implementation for demo purposes
        // In production, use a proper geolocation service
        
        if (strpos($ip, '192.168.') === 0 || strpos($ip, '10.') === 0 || strpos($ip, '172.16.') === 0) {
            return null; // Private IP
        }
        
        // Basic regional IP ranges (very simplified)
        $ipLong = ip2long($ip);
        if ($ipLong === false) {
            return null;
        }
        
        // These are simplified ranges for demo - use proper GeoIP database
        $ranges = [
            'US' => [
                ['start' => ip2long('173.252.0.0'), 'end' => ip2long('173.252.255.255')],
                ['start' => ip2long('69.63.176.0'), 'end' => ip2long('69.63.191.255')]
            ],
            'CN' => [
                ['start' => ip2long('123.125.0.0'), 'end' => ip2long('123.125.255.255')]
            ]
        ];
        
        foreach ($ranges as $country => $countryRanges) {
            foreach ($countryRanges as $range) {
                if ($ipLong >= $range['start'] && $ipLong <= $range['end']) {
                    return $country;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get request count for IP (simplified implementation)
     */
    private function getRequestCount(string $ip): int
    {
        // This would integrate with actual rate limiting storage
        // For now, return 0 to avoid false positives
        return 0;
    }
    
    /**
     * Block request and send response
     */
    public function blockRequest(array $analysis): void
    {
        $this->logger->warning('WAF blocked malicious request', [
            'ip' => $this->getClientIP(),
            'threat_level' => $analysis['threat_level'],
            'reasons' => $analysis['reasons'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'timestamp' => date('c')
        ]);
        
        // Send security headers
        if (!headers_sent()) {
            http_response_code(403);
            header('Content-Type: application/json');
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('X-Blocked-By: Safonas-WAF');
        }
        
        // Generic error response
        $response = [
            'success' => false,
            'message' => 'Access denied for security reasons',
            'error_code' => 'WAF_BLOCKED',
            'timestamp' => time()
        ];
        
        echo json_encode($response);
        exit();
    }
    
    /**
     * Add custom rule to WAF
     */
    public function addCustomRule(string $name, string $pattern, int $threatScore): void
    {
        $customRules = $this->config->get('waf.custom_rules', []);
        $customRules[$name] = [
            'pattern' => $pattern,
            'threat_score' => $threatScore,
            'added' => date('c')
        ];
        
        $this->config->set('waf.custom_rules', $customRules);
        $this->logger->info("WAF custom rule added: {$name}");
    }
    
    /**
     * Get WAF statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_requests' => $this->getTotalRequests(),
            'blocked_requests' => $this->getBlockedRequests(),
            'threat_types' => $this->getThreatTypes(),
            'top_blocked_ips' => $this->getTopBlockedIPs(),
            'last_update' => date('c')
        ];
    }
    
    private function getTotalRequests(): int
    {
        // Implementation would track this in logs/database
        return 0;
    }
    
    private function getBlockedRequests(): int
    {
        // Implementation would track this in logs/database
        return 0;
    }
    
    private function getThreatTypes(): array
    {
        // Implementation would analyze logs for threat patterns
        return [];
    }
    
    private function getTopBlockedIPs(): array
    {
        // Implementation would analyze logs for most blocked IPs
        return [];
    }
}