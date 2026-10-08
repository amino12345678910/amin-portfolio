<?php
/**
 * Sensitive Data Protection System
 * Server-side proxy to protect webhook URLs and sensitive information
 * Prevents client-side exposure of credentials and API endpoints
 */

// Load environment variables securely
require_once __DIR__ . '/env-loader.php';

class SensitiveDataProtectionSystem {
    private $config;
    private $security;
    
    public function __construct() {
        $this->loadConfiguration();
        $this->initializeSecurity();
    }
    
    /**
     * Load configuration from secure environment variables
     */
    private function loadConfiguration() {
        $this->config = [
            'webhooks' => [
                'n8n_primary' => EnvLoader::get('N8N_WEBHOOK_PRIMARY', 'https://n8n.safonas.com/webhook/secured-endpoint'),
                'n8n_fallback' => EnvLoader::get('N8N_WEBHOOK_FALLBACK'),
                'timeout' => (int)EnvLoader::get('WEBHOOK_TIMEOUT', 30),
                'max_retries' => (int)EnvLoader::get('WEBHOOK_MAX_RETRIES', 3)
            ],
            'supabase' => [
                'url' => EnvLoader::get('SUPABASE_URL', ''),
                'key' => EnvLoader::get('SUPABASE_ANON_KEY', ''),
                'service_role' => EnvLoader::get('SUPABASE_SERVICE_ROLE', '')
            ],
            'security' => [
                'rate_limit' => (int)EnvLoader::get('RATE_LIMIT_REQUESTS', 60),
                'rate_window' => (int)EnvLoader::get('RATE_LIMIT_WINDOW', 3600),
                'encryption_key' => EnvLoader::get('ENCRYPTION_KEY', ''),
                'allowed_origins' => explode(',', EnvLoader::get('ALLOWED_ORIGINS', 'https://safonas.com,https://www.safonas.com')),
                'jwt_secret' => EnvLoader::get('JWT_SECRET', '')
            ]
        ];
    }
    
    /**
     * Initialize security measures
     */
    private function initializeSecurity() {
        $this->security = [
            'csrf_token' => $this->generateCSRFToken(),
            'session_id' => session_id() ?: session_start(),
            'request_timestamp' => time(),
            'client_ip' => $this->getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        // Set security headers
        $this->setSecurityHeaders();
    }
    
    /**
     * Set comprehensive security headers
     */
    private function setSecurityHeaders() {
        // CORS headers
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, $this->config['security']['allowed_origins'])) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-Token, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        
        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'');
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        
        // Cache control for sensitive endpoints
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    /**
     * Handle webhook proxy request
     */
    public function handleWebhookProxy($request_data) {
        try {
            // Validate request
            $this->validateRequest($request_data);
            
            // Rate limiting
            if (!$this->checkRateLimit()) {
                throw new Exception('Rate limit exceeded', 429);
            }
            
            // Sanitize and validate data
            $sanitized_data = $this->sanitizeRequestData($request_data);
            
            // Add security metadata
            $webhook_payload = [
                'message' => $sanitized_data['message'],
                'timestamp' => date('c'),
                'session_id' => $sanitized_data['session_id'] ?? $this->generateSessionId(),
                'platform' => $sanitized_data['platform'] ?? 'web',
                'security_context' => [
                    'ip_address' => hash('sha256', $this->getClientIP()),
                    'user_agent_hash' => hash('sha256', $this->security['user_agent']),
                    'request_id' => $this->generateRequestId(),
                    'timestamp' => time()
                ]
            ];
            
            // Send to webhook with retry logic
            $response = $this->sendToWebhook($webhook_payload);
            
            // Log successful request (anonymized)
            $this->logRequest('webhook_success', [
                'message_length' => strlen($sanitized_data['message']),
                'session_hash' => hash('sha256', $sanitized_data['session_id'] ?? ''),
                'response_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
            ]);
            
            return $this->formatResponse([
                'success' => true,
                'response' => $response['reply'] ?? 'Message reçu avec succès',
                'request_id' => $webhook_payload['security_context']['request_id']
            ]);
            
        } catch (Exception $e) {
            // Log error (anonymized)
            $this->logRequest('webhook_error', [
                'error_code' => $e->getCode(),
                'error_type' => get_class($e),
                'message_length' => isset($request_data['message']) ? strlen($request_data['message']) : 0
            ]);
            
            return $this->formatResponse([
                'success' => false,
                'error' => $e->getCode() === 429 ? 'Trop de requêtes' : 'Une erreur est survenue',
                'code' => $e->getCode() ?: 500
            ], $e->getCode() ?: 500);
        }
    }
    
    /**
     * Validate incoming request
     */
    private function validateRequest($data) {
        // Check required fields
        if (empty($data['message'])) {
            throw new Exception('Message manquant', 400);
        }
        
        // Check message length
        if (strlen($data['message']) > 5000) {
            throw new Exception('Message trop long', 400);
        }
        
        // Check for suspicious patterns
        if ($this->containsMaliciousPatterns($data['message'])) {
            throw new Exception('Contenu non autorisé', 400);
        }
        
        // Validate session ID format
        if (isset($data['session_id'])) {
            if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i', $data['session_id'])) {
                throw new Exception('Format de session invalide', 400);
            }
        }
        
        // CSRF protection
        if (!$this->validateCSRFToken($data['csrf_token'] ?? '')) {
            throw new Exception('Token CSRF invalide', 403);
        }
    }
    
    /**
     * Sanitize request data
     */
    private function sanitizeRequestData($data) {
        return [
            'message' => strip_tags(trim($data['message'])),
            'session_id' => isset($data['session_id']) ? preg_replace('/[^a-f0-9\-]/i', '', $data['session_id']) : null,
            'platform' => isset($data['platform']) ? preg_replace('/[^a-z_]/i', '', $data['platform']) : 'web'
        ];
    }
    
    /**
     * Check for malicious patterns
     */
    private function containsMaliciousPatterns($text) {
        $malicious_patterns = [
            '/<script/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/eval\(/i',
            '/document\.cookie/i',
            '/window\.location/i',
            '/base64/i'
        ];
        
        foreach ($malicious_patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Send request to webhook with retry logic
     */
    private function sendToWebhook($payload) {
        $max_retries = $this->config['webhooks']['max_retries'];
        $timeout = $this->config['webhooks']['timeout'];
        
        for ($attempt = 1; $attempt <= $max_retries; $attempt++) {
            try {
                $ch = curl_init();
                
                curl_setopt_array($ch, [
                    CURLOPT_URL => $this->config['webhooks']['n8n_primary'],
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => json_encode($payload),
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_CONNECTTIMEOUT => 10,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'User-Agent: Safonas-Proxy/1.0',
                        'X-Request-ID: ' . $payload['security_context']['request_id']
                    ],
                    CURLOPT_SSL_VERIFYPEER => true,
                    CURLOPT_SSL_VERIFYHOST => 2,
                    CURLOPT_FOLLOWLOCATION => false,
                    CURLOPT_MAXREDIRS => 0
                ]);
                
                $response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curl_error = curl_error($ch);
                
                curl_close($ch);
                
                if ($curl_error) {
                    throw new Exception("cURL error: $curl_error");
                }
                
                if ($http_code >= 200 && $http_code < 300) {
                    $decoded = json_decode($response, true);
                    return $decoded ?: ['reply' => 'Message traité avec succès'];
                }
                
                if ($attempt < $max_retries) {
                    sleep($attempt * 2); // Exponential backoff
                    continue;
                }
                
                throw new Exception("Webhook failed with HTTP $http_code");
                
            } catch (Exception $e) {
                if ($attempt >= $max_retries) {
                    throw $e;
                }
            }
        }
        
        throw new Exception('Max retries exceeded');
    }
    
    /**
     * Rate limiting
     */
    private function checkRateLimit() {
        $client_id = hash('sha256', $this->getClientIP() . $this->security['user_agent']);
        $cache_key = "rate_limit_$client_id";
        
        // Simple file-based rate limiting (use Redis in production)
        $cache_file = sys_get_temp_dir() . "/safonas_rate_limit_$client_id";
        $requests = [];
        
        if (file_exists($cache_file)) {
            $requests = json_decode(file_get_contents($cache_file), true) ?: [];
        }
        
        // Clean old requests
        $current_time = time();
        $window = $this->config['security']['rate_window'];
        $requests = array_filter($requests, function($timestamp) use ($current_time, $window) {
            return $current_time - $timestamp < $window;
        });
        
        // Check limit
        if (count($requests) >= $this->config['security']['rate_limit']) {
            return false;
        }
        
        // Add current request
        $requests[] = $current_time;
        file_put_contents($cache_file, json_encode($requests));
        
        return true;
    }
    
    /**
     * Generate CSRF token
     */
    private function generateCSRFToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Validate CSRF token
     */
    private function validateCSRFToken($token) {
        return hash_equals($_SESSION['csrf_token'] ?? '', $token);
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ip_keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Generate session ID
     */
    private function generateSessionId() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    /**
     * Generate request ID
     */
    private function generateRequestId() {
        return uniqid('req_', true) . '_' . bin2hex(random_bytes(8));
    }
    
    /**
     * Log request (anonymized)
     */
    private function logRequest($type, $data) {
        $log_entry = [
            'timestamp' => date('c'),
            'type' => $type,
            'ip_hash' => hash('sha256', $this->getClientIP()),
            'data' => $data
        ];
        
        // Simple file logging (use proper logging system in production)
        $log_file = __DIR__ . '/../logs/webhook_proxy.log';
        file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Format API response
     */
    private function formatResponse($data, $http_code = 200) {
        http_response_code($http_code);
        header('Content-Type: application/json; charset=utf-8');
        
        return json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    
    /**
     * Get public configuration (non-sensitive data only)
     */
    public function getPublicConfiguration() {
        return [
            'endpoints' => [
                'webhook_proxy' => '/api/chatbot-proxy.php',
                'csrf_token' => '/api/csrf-token.php'
            ],
            'security' => [
                'csrf_enabled' => true,
                'rate_limit' => $this->config['security']['rate_limit'],
                'max_message_length' => 5000
            ],
            'features' => [
                'retry_enabled' => true,
                'encryption_enabled' => !empty($this->config['security']['encryption_key'])
            ]
        ];
    }
}

// Initialize the system
if (!function_exists('handleWebhookProxy')) {
    function handleWebhookProxy() {
        session_start();
        
        $protection = new SensitiveDataProtectionSystem();
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            // Handle preflight requests
            exit;
        }
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $request_data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            echo $protection->handleWebhookProxy($request_data);
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['config'])) {
            echo json_encode($protection->getPublicConfiguration());
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    }
}
?>