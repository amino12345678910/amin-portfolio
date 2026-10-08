<?php
/**
 * CSRF Token Endpoint
 * Provides secure CSRF tokens for client-side requests
 */

session_start();

// Set security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS headers for allowed origins only
$allowed_origins = [
    'https://safonas.com',
    'https://www.safonas.com',
    'http://127.0.0.1:5501',  // Local development
    'http://localhost'        // Local development
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

// Generate or retrieve CSRF token
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Return token
echo json_encode([
    'csrf_token' => $_SESSION['csrf_token'],
    'session_id' => session_id(),
    'expires_at' => time() + 3600  // 1 hour
]);
?>