<?php
/**
 * Advanced Input Validation and Sanitization Library
 * Enterprise-grade security for shared hosting environments
 */

namespace Safonas\Security\Validation;

use Safonas\Security\Config\SecurityConfig;

class InputValidator
{
    private $config;
    private $threatPatterns;
    private $validationRules;
    
    public function __construct(SecurityConfig $config)
    {
        $this->config = $config;
        $this->threatPatterns = $config->getThreatPatterns();
        $this->validationRules = $config->getValidationRules();
    }
    
    /**
     * Validate and sanitize input data
     */
    public function validate(array $data, array $customRules = []): array
    {
        $validatedData = [];
        $errors = [];
        
        foreach ($data as $field => $value) {
            try {
                $rules = $customRules[$field] ?? $this->getDefaultRules($field);
                $validatedData[$field] = $this->validateField($field, $value, $rules);
            } catch (ValidationException $e) {
                $errors[$field] = $e->getMessage();
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException('Validation failed', 0, $errors);
        }
        
        return $validatedData;
    }
    
    /**
     * Validate individual field
     */
    private function validateField(string $field, $value, array $rules): string
    {
        // Convert to string if not already
        $value = is_string($value) ? $value : (string) $value;
        
        // Apply sanitization first
        $sanitized = $this->sanitizeInput($value);
        
        // Apply validation rules
        foreach ($rules as $rule => $parameter) {
            if (!$this->applyRule($rule, $sanitized, $parameter)) {
                throw new ValidationException($this->getErrorMessage($field, $rule, $parameter));
            }
        }
        
        // Final threat detection
        $threats = $this->detectThreats($sanitized);
        if (!empty($threats)) {
            throw new ValidationException("Security threat detected: " . implode(', ', $threats));
        }
        
        return $sanitized;
    }
    
    /**
     * Advanced input sanitization
     */
    public function sanitizeInput(string $input): string
    {
        if ($this->validationRules['auto_trim']) {
            $input = trim($input);
        }
        
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        // Normalize Unicode if enabled
        if ($this->validationRules['normalize_unicode'] && function_exists('normalizer_normalize')) {
            $input = normalizer_normalize($input, Normalizer::FORM_C);
        }
        
        // HTML entity encoding for XSS prevention
        $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Remove control characters except tabs, newlines, and carriage returns
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        
        return $input;
    }
    
    /**
     * Apply validation rule
     */
    private function applyRule(string $rule, string $value, $parameter): bool
    {
        switch ($rule) {
            case 'required':
                return !empty($value);
                
            case 'email':
                return $this->validateEmail($value);
                
            case 'max_length':
                return mb_strlen($value, 'UTF-8') <= $parameter;
                
            case 'min_length':
                return mb_strlen($value, 'UTF-8') >= $parameter;
                
            case 'numeric':
                return is_numeric($value);
                
            case 'alpha':
                return preg_match('/^[a-zA-ZÀ-ÿ\s]+$/', $value);
                
            case 'alphanumeric':
                return preg_match('/^[a-zA-Z0-9À-ÿ\s]+$/', $value);
                
            case 'phone':
                return $this->validatePhone($value);
                
            case 'no_html':
                return $value === strip_tags($value);
                
            case 'no_scripts':
                return !preg_match('/<script[^>]*>.*?<\/script>/is', $value);
                
            case 'safe_chars':
                return preg_match('/^[a-zA-Z0-9À-ÿ\s\.\,\!\?\-\_\(\)]+$/', $value);
                
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL) !== false;
                
            case 'domain':
                return preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $value);
                
            default:
                return true;
        }
    }
    
    /**
     * Enhanced email validation
     */
    private function validateEmail(string $email): bool
    {
        // Basic format validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        
        // Length check
        if (strlen($email) > $this->validationRules['email_max_length']) {
            return false;
        }
        
        // Header injection check
        $maliciousPatterns = [
            '/[\r\n]/',
            '/bcc:/i',
            '/cc:/i', 
            '/to:/i',
            '/from:/i',
            '/subject:/i',
            '/content-type:/i',
            '/mime-version:/i'
        ];
        
        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $email)) {
                return false;
            }
        }
        
        // Domain validation
        list($local, $domain) = explode('@', $email);
        
        // Check local part length (64 chars max)
        if (strlen($local) > 64) {
            return false;
        }
        
        // Check domain part
        if (strlen($domain) > 253) {
            return false;
        }
        
        // Validate domain format
        if (!preg_match('/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $domain)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Phone number validation
     */
    private function validatePhone(string $phone): bool
    {
        // Remove common separators
        $cleaned = preg_replace('/[\s\-\(\)\+\.]/', '', $phone);
        
        // Check if all digits (with optional country code)
        if (!preg_match('/^[0-9]+$/', $cleaned)) {
            return false;
        }
        
        // Check length (international format: 7-15 digits)
        $length = strlen($cleaned);
        return $length >= 7 && $length <= 15;
    }
    
    /**
     * Detect security threats in input
     */
    public function detectThreats(string $input): array
    {
        $threats = [];
        
        foreach ($this->threatPatterns as $threatType => $pattern) {
            if (preg_match($pattern, $input)) {
                $threats[] = $threatType;
            }
        }
        
        // Additional custom threat detection
        if ($this->detectSqlInjectionAdvanced($input)) {
            $threats[] = 'advanced_sql_injection';
        }
        
        if ($this->detectXssAdvanced($input)) {
            $threats[] = 'advanced_xss';
        }
        
        if ($this->detectCommandInjectionAdvanced($input)) {
            $threats[] = 'advanced_command_injection';
        }
        
        return array_unique($threats);
    }
    
    /**
     * Advanced SQL injection detection
     */
    private function detectSqlInjectionAdvanced(string $input): bool
    {
        $sqlPatterns = [
            '/(\bor\b|\band\b).*[\'"][^\'\"]*[\'"].*=/i',
            '/\bunion\s+select\b/i',
            '/\bdrop\s+table\b/i',
            '/\binsert\s+into\b/i',
            '/\bdelete\s+from\b/i',
            '/\bupdate\s+\w+\s+set\b/i',
            '/\btablename\s*=\s*[\'"][^\'"]*[\'"]--/i',
            '/[\'"]\s*;\s*\w+/i',
            '/\bhex\(/i',
            '/\bchar\(/i',
            '/\bconcat\(/i',
            '/\bsubstring\(/i'
        ];
        
        foreach ($sqlPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Advanced XSS detection
     */
    private function detectXssAdvanced(string $input): bool
    {
        $xssPatterns = [
            '/on\w+\s*=\s*[\'"][^\'"]*[\'\"]/i',
            '/expression\s*\(/i',
            '/url\s*\(\s*[\'"]?javascript:/i',
            '/@import.*javascript:/i',
            '/\bvbscript:/i',
            '/<\s*iframe/i',
            '/<\s*object/i',
            '/<\s*embed/i',
            '/<\s*applet/i',
            '/<\s*meta.*http-equiv/i',
            '/<\s*link.*href.*javascript:/i'
        ];
        
        foreach ($xssPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Advanced command injection detection
     */
    private function detectCommandInjectionAdvanced(string $input): bool
    {
        $cmdPatterns = [
            '/;\s*(rm|del|format|fdisk)\b/i',
            '/\|\s*(cat|type|more|less)\b/i',
            '/&&\s*(nc|netcat|telnet)\b/i',
            '/`[^`]*`/',
            '/\$\([^)]*\)/',
            '/\bwget\s+http/i',
            '/\bcurl\s+http/i',
            '/\bchmod\s+\d+/i',
            '/\bsu\s+\w+/i'
        ];
        
        foreach ($cmdPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get default validation rules for field
     */
    private function getDefaultRules(string $field): array
    {
        $defaultRules = [
            'name' => [
                'required' => true,
                'max_length' => $this->validationRules['name_max_length'],
                'alpha' => true,
                'no_html' => true
            ],
            'email' => [
                'required' => true,
                'email' => true,
                'max_length' => $this->validationRules['email_max_length']
            ],
            'subject' => [
                'max_length' => $this->validationRules['subject_max_length'],
                'no_html' => true,
                'safe_chars' => true
            ],
            'message' => [
                'required' => true,
                'max_length' => $this->validationRules['message_max_length'],
                'no_scripts' => true
            ],
            'phone' => [
                'phone' => true,
                'max_length' => $this->validationRules['phone_max_length']
            ],
            'company' => [
                'max_length' => $this->validationRules['company_max_length'],
                'alphanumeric' => true,
                'no_html' => true
            ],
            'position' => [
                'max_length' => $this->validationRules['position_max_length'],
                'safe_chars' => true,
                'no_html' => true
            ],
            'revenue' => [
                'max_length' => $this->validationRules['revenue_max_length'],
                'safe_chars' => true
            ]
        ];
        
        return $defaultRules[$field] ?? ['safe_chars' => true, 'no_html' => true];
    }
    
    /**
     * Get error message for validation rule
     */
    private function getErrorMessage(string $field, string $rule, $parameter): string
    {
        $messages = [
            'required' => "Le champ {$field} est requis",
            'email' => "L'adresse email n'est pas valide",
            'max_length' => "Le champ {$field} est trop long (maximum {$parameter} caractères)",
            'min_length' => "Le champ {$field} est trop court (minimum {$parameter} caractères)",
            'numeric' => "Le champ {$field} doit être numérique",
            'alpha' => "Le champ {$field} ne peut contenir que des lettres",
            'alphanumeric' => "Le champ {$field} ne peut contenir que des lettres et chiffres",
            'phone' => "Le numéro de téléphone n'est pas valide",
            'no_html' => "Le champ {$field} ne peut pas contenir de HTML",
            'no_scripts' => "Le champ {$field} contient du code non autorisé",
            'safe_chars' => "Le champ {$field} contient des caractères non autorisés",
            'url' => "L'URL n'est pas valide",
            'domain' => "Le domaine n'est pas valide"
        ];
        
        return $messages[$rule] ?? "Erreur de validation pour le champ {$field}";
    }
    
    /**
     * Validate honeypot field
     */
    public function validateHoneypot(array $data): bool
    {
        $honeypotConfig = $this->config->getHoneypotConfig();
        
        if (!$honeypotConfig['enabled']) {
            return true;
        }
        
        $honeypotField = $honeypotConfig['field_name'];
        
        // Check if honeypot field exists and is empty
        if (isset($data[$honeypotField]) && !empty($data[$honeypotField])) {
            return false; // Bot detected
        }
        
        // Check timing (if form was submitted too quickly)
        if (isset($_SESSION['form_start_time'])) {
            $timeTaken = time() - $_SESSION['form_start_time'];
            if ($timeTaken < $honeypotConfig['time_threshold']) {
                return false; // Submitted too quickly
            }
        }
        
        return true;
    }
    
    /**
     * Generate form timestamp for timing validation
     */
    public function generateFormTimestamp(): void
    {
        $_SESSION['form_start_time'] = time();
    }
}

/**
 * Validation Exception
 */
class ValidationException extends \Exception
{
    private $validationErrors;
    
    public function __construct(string $message = '', int $code = 0, array $errors = [], \Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->validationErrors = $errors;
    }
    
    public function getValidationErrors(): array
    {
        return $this->validationErrors;
    }
}