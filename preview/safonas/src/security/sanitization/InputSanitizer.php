<?php
/**
 * Comprehensive Input Sanitization Library
 * Advanced input cleaning and validation for security
 * 
 * @package Safonas\Security\Sanitization
 * @version 1.0.0
 */

namespace Safonas\Security\Sanitization;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;

class InputSanitizer
{
    private $config;
    private $logger;
    private $encoding = 'UTF-8';
    private $threatPatterns = [];
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->encoding = $config->get('validation.encoding', 'UTF-8');
        $this->threatPatterns = $config->getThreatPatterns();
    }
    
    /**
     * Sanitize string input with multiple layers of protection
     */
    public function sanitizeString(string $input, array $options = []): string
    {
        $options = array_merge([
            'max_length' => $this->config->get('validation.max_input_length', 10000),
            'trim' => true,
            'normalize' => true,
            'strip_tags' => true,
            'decode_entities' => true,
            'remove_nullbytes' => true,
            'normalize_whitespace' => true,
            'remove_control_chars' => true,
            'validate_encoding' => true
        ], $options);
        
        $originalInput = $input;
        
        try {
            // Step 1: Validate encoding
            if ($options['validate_encoding'] && !mb_check_encoding($input, $this->encoding)) {
                $this->logger->warning('Invalid encoding detected', [
                    'input_sample' => substr($input, 0, 100)
                ]);
                $input = mb_convert_encoding($input, $this->encoding, 'auto');
            }
            
            // Step 2: Remove null bytes (security risk)
            if ($options['remove_nullbytes']) {
                $input = str_replace("\0", '', $input);
            }
            
            // Step 3: Normalize Unicode
            if ($options['normalize'] && function_exists('normalizer_normalize')) {
                $input = normalizer_normalize($input, Normalizer::FORM_C);
            }
            
            // Step 4: Trim whitespace
            if ($options['trim']) {
                $input = trim($input);
            }
            
            // Step 5: Remove control characters
            if ($options['remove_control_chars']) {
                $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
            }
            
            // Step 6: Normalize whitespace
            if ($options['normalize_whitespace']) {
                $input = preg_replace('/\s+/', ' ', $input);
            }
            
            // Step 7: Decode HTML entities
            if ($options['decode_entities']) {
                $input = html_entity_decode($input, ENT_QUOTES | ENT_HTML5, $this->encoding);
            }
            
            // Step 8: Strip HTML tags
            if ($options['strip_tags']) {
                $allowedTags = $this->config->get('validation.allowed_html_tags', []);
                if (empty($allowedTags)) {
                    $input = strip_tags($input);
                } else {
                    $input = strip_tags($input, '<' . implode('><', $allowedTags) . '>');
                }
            }
            
            // Step 9: Truncate to max length
            if ($options['max_length'] > 0) {
                $input = mb_substr($input, 0, $options['max_length'], $this->encoding);
            }
            
            // Step 10: Final trim
            $input = trim($input);
            
            // Log if input was significantly modified
            if (strlen($originalInput) - strlen($input) > 10) {
                $this->logger->info('Input significantly sanitized', [
                    'original_length' => strlen($originalInput),
                    'sanitized_length' => strlen($input),
                    'original_sample' => substr($originalInput, 0, 50),
                    'sanitized_sample' => substr($input, 0, 50)
                ]);
            }
            
        } catch (Exception $e) {
            $this->logger->error('Error during input sanitization', [
                'error' => $e->getMessage(),
                'input_sample' => substr($originalInput, 0, 100)
            ]);
            
            // Fallback to basic sanitization
            $input = strip_tags(trim($originalInput));
            $input = mb_substr($input, 0, $options['max_length'], $this->encoding);
        }
        
        return $input;
    }
    
    /**
     * Sanitize email address
     */
    public function sanitizeEmail(string $email): ?string
    {
        $email = $this->sanitizeString($email, [
            'max_length' => 320,
            'strip_tags' => true,
            'decode_entities' => false
        ]);
        
        // Remove spaces and convert to lowercase
        $email = strtolower(str_replace(' ', '', $email));
        
        // Basic email validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }
        
        // Additional security checks
        if ($this->containsThreat($email)) {
            $this->logger->warning('Threat detected in email', ['email' => $email]);
            return null;
        }
        
        return $email;
    }
    
    /**
     * Sanitize phone number
     */
    public function sanitizePhone(string $phone): string
    {
        $phone = $this->sanitizeString($phone, [
            'max_length' => 20,
            'strip_tags' => true
        ]);
        
        // Keep only digits, spaces, dashes, parentheses, and plus sign
        $phone = preg_replace('/[^0-9\s\-\(\)\+]/', '', $phone);
        
        return trim($phone);
    }
    
    /**
     * Sanitize name (person or company)
     */
    public function sanitizeName(string $name): string
    {
        $name = $this->sanitizeString($name, [
            'max_length' => 100,
            'strip_tags' => true,
            'normalize' => true
        ]);
        
        // Allow letters, spaces, hyphens, apostrophes, and dots
        $name = preg_replace('/[^a-zA-ZÀ-ÿ\s\-\'\.]/', '', $name);
        
        // Remove excessive whitespace and normalize
        $name = preg_replace('/\s+/', ' ', $name);
        $name = ucwords(strtolower($name));
        
        return trim($name);
    }
    
    /**
     * Sanitize message/textarea content
     */
    public function sanitizeMessage(string $message): string
    {
        $message = $this->sanitizeString($message, [
            'max_length' => $this->config->get('validation.message_max_length', 5000),
            'strip_tags' => true,
            'normalize_whitespace' => false, // Preserve line breaks
            'decode_entities' => true
        ]);
        
        // Check for threats
        if ($this->containsThreat($message)) {
            $this->logger->warning('Threat detected in message', [
                'message_sample' => substr($message, 0, 100)
            ]);
            
            // Remove threatening content
            $message = $this->removeThreatPatterns($message);
        }
        
        // Normalize line breaks
        $message = str_replace(["\r\n", "\r"], "\n", $message);
        
        // Limit consecutive line breaks
        $message = preg_replace('/\n{3,}/', "\n\n", $message);
        
        return trim($message);
    }
    
    /**
     * Sanitize URL
     */
    public function sanitizeUrl(string $url): ?string
    {
        $url = $this->sanitizeString($url, [
            'max_length' => 2048,
            'strip_tags' => true,
            'trim' => true
        ]);
        
        // Validate URL format
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }
        
        // Check for allowed protocols
        $allowedProtocols = ['http', 'https', 'ftp', 'ftps'];
        $protocol = strtolower(parse_url($url, PHP_URL_SCHEME));
        
        if (!in_array($protocol, $allowedProtocols)) {
            $this->logger->warning('Disallowed URL protocol', ['url' => $url, 'protocol' => $protocol]);
            return null;
        }
        
        // Check for threats in URL
        if ($this->containsThreat($url)) {
            $this->logger->warning('Threat detected in URL', ['url' => $url]);
            return null;
        }
        
        return $url;
    }
    
    /**
     * Sanitize array of inputs
     */
    public function sanitizeArray(array $input, array $rules = []): array
    {
        $sanitized = [];
        
        foreach ($input as $key => $value) {
            $sanitizedKey = $this->sanitizeString($key, ['max_length' => 100]);
            
            if (is_array($value)) {
                $sanitized[$sanitizedKey] = $this->sanitizeArray($value, $rules[$key] ?? []);
            } else {
                $rule = $rules[$key] ?? 'string';
                $sanitized[$sanitizedKey] = $this->sanitizeByType($value, $rule);
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Sanitize based on data type
     */
    public function sanitizeByType($value, string $type): mixed
    {
        switch ($type) {
            case 'email':
                return $this->sanitizeEmail((string)$value);
                
            case 'phone':
                return $this->sanitizePhone((string)$value);
                
            case 'name':
                return $this->sanitizeName((string)$value);
                
            case 'message':
                return $this->sanitizeMessage((string)$value);
                
            case 'url':
                return $this->sanitizeUrl((string)$value);
                
            case 'int':
            case 'integer':
                return filter_var($value, FILTER_VALIDATE_INT) !== false ? (int)$value : 0;
                
            case 'float':
                return filter_var($value, FILTER_VALIDATE_FLOAT) !== false ? (float)$value : 0.0;
                
            case 'bool':
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
                
            case 'string':
            default:
                return $this->sanitizeString((string)$value);
        }
    }
    
    /**
     * Check if input contains threat patterns
     */
    public function containsThreat(string $input): bool
    {
        foreach ($this->threatPatterns as $type => $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Remove threat patterns from input
     */
    private function removeThreatPatterns(string $input): string
    {
        foreach ($this->threatPatterns as $type => $pattern) {
            $input = preg_replace($pattern, '', $input);
        }
        
        return $input;
    }
    
    /**
     * Deep clean input for maximum security
     */
    public function deepClean(string $input): string
    {
        // Multiple passes of cleaning
        $passes = 3;
        $cleaned = $input;
        
        for ($i = 0; $i < $passes; $i++) {
            $beforeLength = strlen($cleaned);
            
            // Apply all sanitization methods
            $cleaned = $this->sanitizeString($cleaned);
            $cleaned = $this->removeThreatPatterns($cleaned);
            
            // Remove double encoding attempts
            $cleaned = $this->removeDoubleEncoding($cleaned);
            
            // Remove obfuscated content
            $cleaned = $this->removeObfuscation($cleaned);
            
            $afterLength = strlen($cleaned);
            
            // If no changes were made, we're done
            if ($beforeLength === $afterLength) {
                break;
            }
        }
        
        return $cleaned;
    }
    
    /**
     * Remove double encoding attempts
     */
    private function removeDoubleEncoding(string $input): string
    {
        // Remove multiple URL encoding
        $decoded = $input;
        $maxDecoding = 5;
        
        for ($i = 0; $i < $maxDecoding; $i++) {
            $newDecoded = urldecode($decoded);
            if ($newDecoded === $decoded) {
                break;
            }
            $decoded = $newDecoded;
        }
        
        // Remove HTML entity double encoding
        for ($i = 0; $i < $maxDecoding; $i++) {
            $newDecoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, $this->encoding);
            if ($newDecoded === $decoded) {
                break;
            }
            $decoded = $newDecoded;
        }
        
        return $decoded;
    }
    
    /**
     * Remove obfuscated content
     */
    private function removeObfuscation(string $input): string
    {
        // Remove Unicode obfuscation
        $input = preg_replace('/\\\\u[0-9a-fA-F]{4}/', '', $input);
        
        // Remove hex encoding
        $input = preg_replace('/\\\\x[0-9a-fA-F]{2}/', '', $input);
        
        // Remove octal encoding
        $input = preg_replace('/\\\\[0-7]{3}/', '', $input);
        
        // Remove excessive escaping
        $input = preg_replace('/\\\\{2,}/', '\\', $input);
        
        return $input;
    }
    
    /**
     * Validate input against custom patterns
     */
    public function validatePattern(string $input, string $pattern, string $patternName = 'custom'): bool
    {
        if (!preg_match($pattern, $input)) {
            $this->logger->info('Input failed pattern validation', [
                'pattern_name' => $patternName,
                'input_sample' => substr($input, 0, 50)
            ]);
            return false;
        }
        
        return true;
    }
    
    /**
     * Get sanitization statistics
     */
    public function getStatistics(): array
    {
        // This would track statistics in a real implementation
        return [
            'total_sanitizations' => 0,
            'threats_detected' => 0,
            'encodings_fixed' => 0,
            'tags_stripped' => 0
        ];
    }
    
    /**
     * Create custom sanitization rule
     */
    public function addCustomRule(string $name, callable $sanitizer): void
    {
        // Store custom rules for later use
        $this->customRules[$name] = $sanitizer;
        
        $this->logger->info("Custom sanitization rule added: {$name}");
    }
    
    /**
     * Bulk sanitize multiple inputs
     */
    public function bulkSanitize(array $inputs, array $types = []): array
    {
        $results = [];
        
        foreach ($inputs as $key => $value) {
            $type = $types[$key] ?? 'string';
            $results[$key] = $this->sanitizeByType($value, $type);
        }
        
        return $results;
    }
    
    /**
     * Check if sanitization was successful
     */
    public function isSanitizationSafe(string $original, string $sanitized): bool
    {
        // If more than 50% of content was removed, it might indicate a problem
        $originalLength = strlen($original);
        $sanitizedLength = strlen($sanitized);
        
        if ($originalLength > 0 && ($sanitizedLength / $originalLength) < 0.5) {
            $this->logger->warning('Excessive content removed during sanitization', [
                'original_length' => $originalLength,
                'sanitized_length' => $sanitizedLength,
                'removal_percentage' => (1 - $sanitizedLength / $originalLength) * 100
            ]);
            return false;
        }
        
        return true;
    }
}