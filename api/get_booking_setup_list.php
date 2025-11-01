<?php
// ========================================
// Fetch all Booking Setup from Business Central
// ========================================

require_once __DIR__ . '/get_token.php';

// Get your cached token
$tokenData = json_decode(file_get_contents(__DIR__ . '/token_cache.json'), true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(401);
    echo json_encode(['error' => 'No valid access token found']);
    exit;
}

$tenantId = $_ENV['TENANT_ID'];
$environment = 'SandboxDev2'; 
$company = 'SQUADLETHICS';

// API endpoint
$url = "https://api.businesscentral.dynamics.com/v2.0/$tenantId/$environment/ODataV4/BookingAppointment_GetBookingSetupList?Company=$company";

// Initialize cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $accessToken",
    "Accept: application/json",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, ""); 

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Handle errors
if ($curlError) {
    echo json_encode(['error' => 'cURL Error', 'message' => $curlError]);
    exit;
}

if ($httpCode < 200 || $httpCode >= 300) {
    echo json_encode(['error' => 'Failed request', 'status' => $httpCode, 'response' => $response]);
    exit;
}

// Parse and output response
$json = json_decode($response, true);
header('Content-Type: application/json');
if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode($json, JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'Invalid JSON from Business Central', 'raw' => $response]);
}
