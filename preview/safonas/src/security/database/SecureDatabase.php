<?php
/**
 * Secure Database Layer with Prepared Statements and Query Protection
 * Advanced SQL injection prevention and query logging
 * 
 * @package Safonas\Security\Database
 * @version 1.0.0
 */

namespace Safonas\Security\Database;

use Safonas\Security\Config\SecurityConfig;
use Safonas\Security\Logging\SecurityLogger;
use Safonas\Security\Encryption\EncryptionManager;
use PDO;
use PDOException;
use PDOStatement;

class SecureDatabase
{
    private $config;
    private $logger;
    private $encryption;
    private $connection = null;
    private $transactionLevel = 0;
    private $queryLog = [];
    private $allowedQueries = [];
    private $blockedPatterns = [];
    
    public function __construct(SecurityConfig $config, SecurityLogger $logger, EncryptionManager $encryption)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->encryption = $encryption;
        
        $this->initializeSecurityRules();
    }
    
    /**
     * Establish secure database connection
     */
    public function connect(array $dsn): bool
    {
        try {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
                PDO::ATTR_TIMEOUT => $this->config->get('database.connection_timeout', 30),
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => false // Prevent multiple statements
            ];
            
            // Build DSN string
            $dsnString = $this->buildDsnString($dsn);
            
            $this->connection = new PDO($dsnString, $dsn['username'], $dsn['password'], $options);
            
            // Set additional security settings
            $this->connection->exec("SET SESSION sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
            $this->connection->exec("SET SESSION autocommit=1");
            
            $this->logger->info('Database connection established securely', [
                'host' => $dsn['host'] ?? 'localhost',
                'database' => $dsn['database'] ?? 'unknown'
            ]);
            
            return true;
            
        } catch (PDOException $e) {
            $this->logger->error('Database connection failed', [
                'error' => $e->getMessage(),
                'host' => $dsn['host'] ?? 'localhost'
            ]);
            return false;
        }
    }
    
    /**
     * Execute secure prepared statement
     */
    public function executeSecure(string $sql, array $params = []): ?PDOStatement
    {
        if (!$this->connection) {
            throw new DatabaseSecurityException('No database connection');
        }
        
        // Security validations
        if (!$this->validateQuery($sql)) {
            throw new DatabaseSecurityException('Query failed security validation');
        }
        
        if (!$this->validateParameters($params)) {
            throw new DatabaseSecurityException('Parameters failed security validation');
        }
        
        try {
            $startTime = microtime(true);
            
            // Prepare and execute statement
            $stmt = $this->connection->prepare($sql);
            
            if (!$stmt) {
                throw new DatabaseSecurityException('Failed to prepare statement');
            }
            
            // Bind parameters securely
            $this->bindParameters($stmt, $params);
            
            $executed = $stmt->execute();
            
            if (!$executed) {
                throw new DatabaseSecurityException('Failed to execute statement');
            }
            
            $executionTime = microtime(true) - $startTime;
            
            // Log query execution
            $this->logQuery($sql, $params, $executionTime, true);
            
            return $stmt;
            
        } catch (PDOException $e) {
            $this->logger->error('Database query failed', [
                'sql' => $this->sanitizeQueryForLog($sql),
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            
            $this->logQuery($sql, $params, 0, false, $e->getMessage());
            
            throw new DatabaseSecurityException('Query execution failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Secure SELECT query
     */
    public function select(string $sql, array $params = []): array
    {
        // Ensure it's a SELECT query
        if (!preg_match('/^\s*SELECT\s/i', trim($sql))) {
            throw new DatabaseSecurityException('Only SELECT queries allowed in select() method');
        }
        
        $stmt = $this->executeSecure($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Secure INSERT query
     */
    public function insert(string $table, array $data, array $encryptFields = []): int
    {
        $this->validateTableName($table);
        
        // Encrypt sensitive fields
        if (!empty($encryptFields)) {
            $data = $this->encryptFields($data, $encryptFields);
        }
        
        $fields = array_keys($data);
        $placeholders = array_map(function($field) { return ":{$field}"; }, $fields);
        
        $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $fields) . "`) VALUES (" . implode(', ', $placeholders) . ")";
        
        $this->executeSecure($sql, $data);
        
        return (int)$this->connection->lastInsertId();
    }
    
    /**
     * Secure UPDATE query
     */
    public function update(string $table, array $data, array $where, array $encryptFields = []): int
    {
        $this->validateTableName($table);
        
        // Encrypt sensitive fields
        if (!empty($encryptFields)) {
            $data = $this->encryptFields($data, $encryptFields);
        }
        
        $setClause = [];
        foreach (array_keys($data) as $field) {
            $setClause[] = "`{$field}` = :{$field}";
        }
        
        $whereClause = [];
        foreach (array_keys($where) as $field) {
            $whereClause[] = "`{$field}` = :where_{$field}";
        }
        
        $sql = "UPDATE `{$table}` SET " . implode(', ', $setClause) . " WHERE " . implode(' AND ', $whereClause);
        
        $params = array_merge($data, array_combine(
            array_map(function($k) { return "where_{$k}"; }, array_keys($where)),
            array_values($where)
        ));
        
        $stmt = $this->executeSecure($sql, $params);
        
        return $stmt->rowCount();
    }
    
    /**
     * Secure DELETE query
     */
    public function delete(string $table, array $where): int
    {
        $this->validateTableName($table);
        
        if (empty($where)) {
            throw new DatabaseSecurityException('DELETE without WHERE clause not allowed');
        }
        
        $whereClause = [];
        foreach (array_keys($where) as $field) {
            $whereClause[] = "`{$field}` = :{$field}";
        }
        
        $sql = "DELETE FROM `{$table}` WHERE " . implode(' AND ', $whereClause);
        
        $stmt = $this->executeSecure($sql, $where);
        
        return $stmt->rowCount();
    }
    
    /**
     * Begin secure transaction
     */
    public function beginTransaction(): bool
    {
        if ($this->transactionLevel === 0) {
            $result = $this->connection->beginTransaction();
            if ($result) {
                $this->transactionLevel++;
                $this->logger->debug('Database transaction started');
            }
            return $result;
        } else {
            $this->transactionLevel++;
            return true; // Nested transaction
        }
    }
    
    /**
     * Commit transaction
     */
    public function commit(): bool
    {
        if ($this->transactionLevel === 1) {
            $result = $this->connection->commit();
            if ($result) {
                $this->transactionLevel--;
                $this->logger->debug('Database transaction committed');
            }
            return $result;
        } elseif ($this->transactionLevel > 1) {
            $this->transactionLevel--;
            return true; // Nested transaction
        }
        
        return false;
    }
    
    /**
     * Rollback transaction
     */
    public function rollback(): bool
    {
        if ($this->transactionLevel >= 1) {
            $result = $this->connection->rollback();
            $this->transactionLevel = 0;
            $this->logger->debug('Database transaction rolled back');
            return $result;
        }
        
        return false;
    }
    
    /**
     * Get query execution statistics
     */
    public function getQueryStats(): array
    {
        $stats = [
            'total_queries' => count($this->queryLog),
            'successful_queries' => 0,
            'failed_queries' => 0,
            'average_execution_time' => 0,
            'slowest_query' => null,
            'query_types' => []
        ];
        
        $totalTime = 0;
        $slowestTime = 0;
        
        foreach ($this->queryLog as $query) {
            if ($query['success']) {
                $stats['successful_queries']++;
                $totalTime += $query['execution_time'];
                
                if ($query['execution_time'] > $slowestTime) {
                    $slowestTime = $query['execution_time'];
                    $stats['slowest_query'] = $query;
                }
            } else {
                $stats['failed_queries']++;
            }
            
            $type = $this->getQueryType($query['sql']);
            $stats['query_types'][$type] = ($stats['query_types'][$type] ?? 0) + 1;
        }
        
        if ($stats['successful_queries'] > 0) {
            $stats['average_execution_time'] = $totalTime / $stats['successful_queries'];
        }
        
        return $stats;
    }
    
    /**
     * Initialize security rules
     */
    private function initializeSecurityRules(): void
    {
        // Allowed query patterns
        $this->allowedQueries = [
            '/^\s*SELECT\s/i',
            '/^\s*INSERT\s/i',
            '/^\s*UPDATE\s/i',
            '/^\s*DELETE\s/i'
        ];
        
        // Blocked patterns (SQL injection attempts)
        $this->blockedPatterns = [
            '/;\s*(DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\s/i',
            '/UNION\s+(ALL\s+)?SELECT/i',
            '/\/\*.*\*\//i', // SQL comments
            '/--.*$/m', // SQL line comments
            '/\b(BENCHMARK|SLEEP|WAITFOR)\s*\(/i',
            '/\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i',
            '/\b(INFORMATION_SCHEMA|mysql\.)\w+/i',
            '/\b(CHAR|ASCII|ORD|HEX|UNHEX|CONV)\s*\(/i',
            '/\b(SUBSTRING|MID|LEFT|RIGHT)\s*\(/i'
        ];
    }
    
    /**
     * Validate SQL query for security
     */
    private function validateQuery(string $sql): bool
    {
        $sql = trim($sql);
        
        // Check if query type is allowed
        $typeAllowed = false;
        foreach ($this->allowedQueries as $pattern) {
            if (preg_match($pattern, $sql)) {
                $typeAllowed = true;
                break;
            }
        }
        
        if (!$typeAllowed) {
            $this->logger->warning('Disallowed query type attempted', [
                'sql' => $this->sanitizeQueryForLog($sql)
            ]);
            return false;
        }
        
        // Check for blocked patterns
        foreach ($this->blockedPatterns as $pattern) {
            if (preg_match($pattern, $sql)) {
                $this->logger->critical('SQL injection attempt detected', [
                    'sql' => $this->sanitizeQueryForLog($sql),
                    'pattern' => $pattern,
                    'ip' => $this->getClientIP()
                ]);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validate query parameters
     */
    private function validateParameters(array $params): bool
    {
        foreach ($params as $key => $value) {
            // Check parameter name
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
                $this->logger->warning('Invalid parameter name', ['key' => $key]);
                return false;
            }
            
            // Check for SQL injection in parameter values
            if (is_string($value)) {
                foreach ($this->blockedPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        $this->logger->warning('Suspicious parameter value', [
                            'key' => $key,
                            'value' => substr($value, 0, 100)
                        ]);
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Bind parameters to prepared statement
     */
    private function bindParameters(PDOStatement $stmt, array $params): void
    {
        foreach ($params as $key => $value) {
            $paramKey = is_int($key) ? $key + 1 : ":{$key}";
            
            if (is_int($value)) {
                $stmt->bindValue($paramKey, $value, PDO::PARAM_INT);
            } elseif (is_bool($value)) {
                $stmt->bindValue($paramKey, $value, PDO::PARAM_BOOL);
            } elseif (is_null($value)) {
                $stmt->bindValue($paramKey, $value, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue($paramKey, $value, PDO::PARAM_STR);
            }
        }
    }
    
    /**
     * Validate table name
     */
    private function validateTableName(string $table): void
    {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new DatabaseSecurityException('Invalid table name');
        }
    }
    
    /**
     * Encrypt sensitive fields
     */
    private function encryptFields(array $data, array $encryptFields): array
    {
        foreach ($encryptFields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $data[$field] = $this->encryption->encrypt($data[$field]);
            }
        }
        
        return $data;
    }
    
    /**
     * Log query execution
     */
    private function logQuery(string $sql, array $params, float $executionTime, bool $success, string $error = ''): void
    {
        $logEntry = [
            'timestamp' => time(),
            'sql' => $this->sanitizeQueryForLog($sql),
            'params_count' => count($params),
            'execution_time' => $executionTime,
            'success' => $success,
            'error' => $error,
            'ip' => $this->getClientIP()
        ];
        
        $this->queryLog[] = $logEntry;
        
        if ($this->config->get('database.log_queries', false)) {
            $level = $success ? 'debug' : 'error';
            $this->logger->log($level, 'Database query executed', $logEntry);
        }
        
        // Log slow queries
        $slowQueryThreshold = $this->config->get('database.slow_query_threshold', 1.0);
        if ($success && $executionTime > $slowQueryThreshold) {
            $this->logger->warning('Slow query detected', $logEntry);
        }
    }
    
    /**
     * Sanitize query for logging
     */
    private function sanitizeQueryForLog(string $sql): string
    {
        // Remove sensitive data patterns
        $sql = preg_replace('/\'[^\']*\'/', '\'[REDACTED]\'', $sql);
        $sql = preg_replace('/\"[^\"]*\"/', '"[REDACTED]"', $sql);
        
        return substr($sql, 0, 500); // Limit length
    }
    
    /**
     * Get query type
     */
    private function getQueryType(string $sql): string
    {
        $sql = trim(strtoupper($sql));
        
        if (strpos($sql, 'SELECT') === 0) return 'SELECT';
        if (strpos($sql, 'INSERT') === 0) return 'INSERT';
        if (strpos($sql, 'UPDATE') === 0) return 'UPDATE';
        if (strpos($sql, 'DELETE') === 0) return 'DELETE';
        
        return 'OTHER';
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
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (isset($_SERVER[$key]) && !empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Build DSN string from array
     */
    private function buildDsnString(array $dsn): string
    {
        $driver = $dsn['driver'] ?? 'mysql';
        $host = $dsn['host'] ?? 'localhost';
        $port = $dsn['port'] ?? 3306;
        $database = $dsn['database'] ?? '';
        $charset = $dsn['charset'] ?? 'utf8mb4';
        
        return "{$driver}:host={$host};port={$port};dbname={$database};charset={$charset}";
    }
    
    /**
     * Close database connection
     */
    public function close(): void
    {
        $this->connection = null;
        $this->logger->debug('Database connection closed');
    }
    
    /**
     * Get connection status
     */
    public function isConnected(): bool
    {
        try {
            return $this->connection && $this->connection->query('SELECT 1') !== false;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Destructor
     */
    public function __destruct()
    {
        if ($this->transactionLevel > 0) {
            $this->rollback();
        }
        $this->close();
    }
}

/**
 * Database Security Exception
 */
class DatabaseSecurityException extends \Exception
{
    
}