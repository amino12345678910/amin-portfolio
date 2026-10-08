<?php
/**
 * Environment Variable Loader
 * Loads environment variables from .env file securely
 */

class EnvLoader {
    private static $loaded = false;
    
    /**
     * Load environment variables from .env file
     */
    public static function load($envFile = null) {
        if (self::$loaded) {
            return;
        }
        
        if ($envFile === null) {
            $envFile = __DIR__ . '/../../.env';
        }
        
        if (!file_exists($envFile)) {
            error_log("Warning: .env file not found at: $envFile");
            return;
        }
        
        try {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            foreach ($lines as $line) {
                // Skip comments and empty lines
                $line = trim($line);
                if ($line === '' || $line[0] === '#') {
                    continue;
                }
                
                // Parse key=value pairs
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $value = trim($parts[1]);
                    
                    // Remove quotes if present
                    if (($value[0] === '"' && substr($value, -1) === '"') ||
                        ($value[0] === "'" && substr($value, -1) === "'")) {
                        $value = substr($value, 1, -1);
                    }
                    
                    // Set environment variable
                    $_ENV[$key] = $value;
                    putenv("$key=$value");
                }
            }
            
            self::$loaded = true;
            
        } catch (Exception $e) {
            error_log("Error loading .env file: " . $e->getMessage());
        }
    }
    
    /**
     * Get environment variable with default value
     */
    public static function get($key, $default = null) {
        return $_ENV[$key] ?? getenv($key) ?: $default;
    }
    
    /**
     * Check if environment variables are loaded
     */
    public static function isLoaded() {
        return self::$loaded;
    }
}

// Auto-load environment variables
EnvLoader::load();
?>