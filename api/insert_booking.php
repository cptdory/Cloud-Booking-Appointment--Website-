<?php
// ==========================================
// Insert Booking Appointment in Business Central
// ==========================================

header('Content-Type: application/json');

// Include access token handler
require_once __DIR__ . '/get_token.php';

// Load access token from cache
$tokenData = json_decode(file_get_contents(__DIR__ . '/token_cache.json'), true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(401);
    echo json_encode(['error' => 'No valid access token found']);
    exit;
}

// Parse incoming JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing JSON body']);
    exit;
}

// Required parameters (from your API structure)
$setupCode = $input['_BookingSetupCode'] ?? null;
$bookingDate = $input['_BookingDate'] ?? null;
$startTime = $input['_BookingStartTime'] ?? null;
$paramCount = $input['_BookingParameterCount'] ?? null;
$paramIDs = $input['_BookingParameterIDs'] ?? null;
$paramValueIDs = $input['_BookingParameterValueIDs'] ?? null;
$location = $input['_Location'] ?? null;

// Validate required fields
if (!$setupCode || !$bookingDate || !$startTime || !$paramIDs || !$paramValueIDs) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing required fields. Expected: _BookingSetupCode, _BookingDate, _BookingStartTime, _BookingParameterIDs, _BookingParameterValueIDs'
    ]);
    exit;
}

// ===============================
// Build target Business Central URL
// ===============================
$tenantId = $_ENV['TENANT_ID'];         
$environment = 'SandboxDev2';
$company = 'SQUADLETHICS';

$url = "https://api.businesscentral.dynamics.com/v2.0/$tenantId/$environment/ODataV4/BookingAppointment_BookAvailableTimeSlotAPI?Company=$company";

// ===============================
// Build request payload
// ===============================
$body = json_encode([
    "_BookingSetupCode" => $setupCode,
    "_BookingDate" => $bookingDate,
    "_BookingStartTime" => $startTime,
    "_BookingParameterCount" => (string)$paramCount,
    "_BookingParameterIDs" => $paramIDs,
    "_BookingParameterValueIDs" => $paramValueIDs,
    "_Location" => $location
]);

// ===============================
// Execute cURL POST request
// ===============================
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $accessToken",
        "Content-Type: application/json",
        "Accept: application/json"
    ],
    CURLOPT_POSTFIELDS => $body
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// ===============================
// Output Response
// ===============================
if ($error) {
    echo json_encode(['error' => "cURL error: $error"]);
} else {
    // Try to decode JSON safely
    $decoded = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode([
            'status' => $httpCode,
            'data' => $decoded
        ], JSON_PRETTY_PRINT);
    } else {
        echo json_encode([
            'status' => $httpCode,
            'raw_response' => $response
        ], JSON_PRETTY_PRINT);
    }
}
