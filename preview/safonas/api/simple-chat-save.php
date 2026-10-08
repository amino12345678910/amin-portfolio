<?php
/**
 * ULTRA SIMPLE Chat Save to Supabase
 * No complexity, just basic functionality
 */

// Enable CORS for all domains (simple approach)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

// Validate required fields with detailed checking
if (!isset($input['user_message']) || !isset($input['chatbot_response']) || 
    trim($input['user_message']) === '' || trim($input['chatbot_response']) === '') {
    echo json_encode([
        'success' => false, 
        'error' => 'Missing or empty required fields',
        'debug' => [
            'user_message_present' => isset($input['user_message']),
            'chatbot_response_present' => isset($input['chatbot_response']),
            'user_message_empty' => isset($input['user_message']) ? (trim($input['user_message']) === '') : 'not_set',
            'chatbot_response_empty' => isset($input['chatbot_response']) ? (trim($input['chatbot_response']) === '') : 'not_set',
            'received_keys' => array_keys($input)
        ]
    ]);
    exit;
}

// Supabase configuration (simple and direct)
$supabase_url = 'https://ejonogfzwsrmuzgiywge.supabase.co/rest/v1/chatbot_interactions';
$supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb25vZ2Z6d3NybXV6Z2l5d2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDc5MDIsImV4cCI6MjA3MjA4MzkwMn0.nMBja006ztFIGcS6hw7pRRroGy-MIJUNOn_yfpYgzxM';

// Generate proper UUID for session_id
function generateUuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Check if session_id is valid UUID format
function isValidUuid($uuid) {
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid);
}

// Ultra minimal data - only required fields with proper UUID validation
$session_id = isset($input['session_id']) && !empty(trim($input['session_id'])) 
    ? trim($input['session_id']) 
    : generateUuid();

// If provided session_id is not valid UUID format, generate a new one
if (!isValidUuid($session_id)) {
    $session_id = generateUuid();
}

$data = [
    'user_message' => trim($input['user_message']),
    'chatbot_response' => trim($input['chatbot_response']),
    'session_id' => $session_id
];

// Send to Supabase using cURL
if (extension_loaded('curl')) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $supabase_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'apikey: ' . $supabase_key,
            'Authorization: Bearer ' . $supabase_key,
            'Prefer: return=representation'
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($response && $http_code >= 200 && $http_code < 300) {
        echo json_encode([
            'success' => true,
            'message' => 'Chat saved successfully',
            'data' => json_decode($response, true)
        ]);
    } else {
        // Ultra detailed error logging for debugging
        $supabase_error = json_decode($response, true);
        
        // Log additional debug info
        $debug_info = [
            'success' => false,
            'error' => 'Failed to save to database',
            'debug' => [
                'http_code' => $http_code,
                'curl_error' => $error ?: 'none',
                'supabase_url' => $supabase_url,
                'sent_data' => $data,
                'raw_response' => $response,
                'parsed_error' => $supabase_error,
                'content_length' => strlen(json_encode($data)),
                'headers_sent' => [
                    'Content-Type: application/json',
                    'apikey: [HIDDEN]',
                    'Authorization: Bearer [HIDDEN]',
                    'Prefer: return=representation'
                ]
            ]
        ];
        
        echo json_encode($debug_info, JSON_PRETTY_PRINT);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'cURL not available'
    ]);
}
?>