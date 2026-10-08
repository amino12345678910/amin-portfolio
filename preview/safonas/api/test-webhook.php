<?php
// Test script to simulate webhook call
header('Content-Type: application/json');

// Get the input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log the request for debugging
error_log("Test webhook received: " . $input);

echo json_encode([
    'reply' => 'Test successful! Received message: ' . ($data['message'] ?? 'No message'),
    'response' => 'Test successful! Received message: ' . ($data['message'] ?? 'No message'),
    'message' => 'Test successful! Received message: ' . ($data['message'] ?? 'No message'),
    'success' => true,
    'received_data' => $data,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>