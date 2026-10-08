<?php
// Simple test to check proxy connectivity
header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'message' => 'Proxy endpoint is accessible',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>