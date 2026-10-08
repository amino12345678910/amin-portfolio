<?php
// EMERGENCY CHATBOT PROXY - Enhanced with debugging and fallback
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Basic headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

// Get input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['message'])) {
    http_response_code(400);
    exit(json_encode(['error' => 'No message provided', 'received' => $input]));
}

// Your working N8N webhook URL
$webhooks = [
    'https://n8n.safonas.com/webhook/d0cdbca7-2772-4e64-9230-0f06e7a53c75/chat'
];

$response = false;
$lastError = '';

// Try each webhook
foreach ($webhooks as $webhookUrl) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhookUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'User-Agent: Safonas-Chatbot/1.0'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // If successful response, return it
    if ($response !== false && $httpCode >= 200 && $httpCode < 400) {
        // Parse the response to extract the chatbot response
        $responseData = json_decode($response, true);

        if ($responseData && isset($responseData['chatbot_response'])) {
            // Map N8N response format to what the frontend expects
            $formattedResponse = [
                'reply' => $responseData['chatbot_response'],
                'response' => $responseData['chatbot_response'],
                'message' => $responseData['chatbot_response'],
                'sessionId' => $responseData['session_id'] ?? null,
                'id' => $responseData['id'] ?? null,
                'success' => true
            ];
            echo json_encode($formattedResponse);
        } else {
            // If parsing fails or no chatbot_response, return original response
            echo $response;
        }
        exit;
    }

    $lastError = "HTTP $httpCode, cURL: $curlError";
}

// All webhooks failed, provide specific error messages
$isWorkflowInactive = strpos($lastError, '404') !== false;
$errorMessage = $isWorkflowInactive
    ? 'Le chatbot est temporairement indisponible (workflow inactif). Notre équipe technique a été notifiée.'
    : 'Je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants.';




http_response_code(200); // Return 200 so frontend shows the message
echo json_encode([
    'reply' => $errorMessage,
    'response' => $errorMessage,
    'message' => $errorMessage,
    'error' => 'Webhook connection failed', 
    'details' => $lastError,
    'workflow_inactive' => $isWorkflowInactive,
    'fallback' => true
]);
?>