<?php
// ===============================
// Get Booking Setup from Business Central
// ===============================

// Load your existing token
require_once __DIR__ . '/get_token.php';

// Read saved token from cache file
$tokenData = json_decode(file_get_contents(__DIR__ . '/token_cache.json'), true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(401);
    echo json_encode(['error' => 'No valid access token found']);
    exit;
}

// Prepare request details
$tenantId = $_ENV['TENANT_ID'];
$environment = 'SandboxDev2'; 
$company = 'SQUADLETHICS';

$url = "https://api.businesscentral.dynamics.com/v2.0/$tenantId/$environment/ODataV4/BookingAppointment_GetBookingSetup?Company=$company";

$booking_setup_code = $_GET['branch'] ?? 'MAIN';
$body = json_encode([
    "_BookingSetupCode" => $booking_setup_code
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $accessToken",
    "Content-Type: application/json",
    "Accept: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Handle errors
if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error', 'message' => $curlError]);
    exit;
}

if (!$response) {
    http_response_code($httpCode);
    echo json_encode(['error' => "Empty response from Business Central", 'httpCode' => $httpCode]);
    exit;
}

//  Force PHP to send valid JSON object, not a string
$json = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE) {
    header('Content-Type: application/json');
    echo json_encode($json, JSON_PRETTY_PRINT);
} else {
    // fallback: send raw string if response isn't valid JSON
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid JSON returned from API', 'raw' => $response]);
}
