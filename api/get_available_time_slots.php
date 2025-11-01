<?php
// ===========================================
// Get Available Time Slots from Business Central
// ===========================================

header('Content-Type: application/json');
require_once __DIR__ . '/get_token.php';

// Load saved token
$tokenData = json_decode(file_get_contents(__DIR__ . '/token_cache.json'), true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(401);
    echo json_encode(['error' => 'No valid access token found']);
    exit;
}

//  Configuration
$tenantId = $_ENV['TENANT_ID'];
$environment = 'SandboxDev2';
$company = 'SQUADLETHICS';

// API endpoint
$url = "https://api.businesscentral.dynamics.com/v2.0/$tenantId/$environment/ODataV4/BookingAppointment_GetAvailableTimeSlotAPI?Company=$company";

//testing
// $bookingSetupCode = 'MAIN';
// $bookingDate = '10/22/25';
// $bookingParamCount = '3';
// $bookingParamIDs = '1|2|3';
// $bookingParamValueIDs = '1|3|6';

// prod
$bookingSetupCode = $_POST['_BookingSetupCode'];
$bookingDate = $_POST['_BookingDate'];
$bookingParamCount = '3';
$bookingParamIDs = '1|2|3';
$bookingParamValueIDs = '1|3|6';

// Build request body
$body = json_encode([
    "_BookingSetupCode" => $bookingSetupCode,
    "_BookingDate" => $bookingDate,
    "_BookingParameterCount" => $bookingParamCount,
    "_BookingParameterIDs" => $bookingParamIDs,
    "_BookingParameterValueIDs" => $bookingParamValueIDs
]);

// cURL setup
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

//  Output formatted JSON
$json = json_decode($response, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode($json, JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'Invalid JSON returned from API', 'raw' => $response]);
}
