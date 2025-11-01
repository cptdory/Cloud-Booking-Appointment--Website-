<?php
// ==========================================
// Create Booking Setup in Business Central
// ==========================================

header('Content-Type: application/json');

// Load access token
require_once __DIR__ . '/get_token.php';

$tokenData = json_decode(file_get_contents(__DIR__ . '/token_cache.json'), true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(401);
    echo json_encode(['error' => 'No valid access token found']);
    exit;
}

// Get POST body from frontend
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing JSON body']);
    exit;
}

// Required fields (you can adjust based on Business Central’s requirements)
$code = $input['_Code'] ?? null;
$desc = $input['_Description'] ?? null;
$loc  = $input['_Location'] ?? null;
$time = $input['_TimeIncrement'] ?? null;
$close = $input['_ClosingAllowableTime'] ?? null;

if (!$code || !$desc || !$loc) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields (_Code, _Description, _Location)']);
    exit;
}

// ===============================
// Send request to Business Central
// ===============================

$tenantId = $_ENV['TENANT_ID'];
$environment = 'SandboxDev2';
$company = 'SQUADLETHICS';

$url = "https://api.businesscentral.dynamics.com/v2.0/$tenantId/$environment/ODataV4/BookingAppointment_CreateBookingSetup?Company=$company";

$body = json_encode([
    "_Code" => $code,
    "_Description" => $desc,
    "_Location" => $loc,
    "_TimeIncrement" => (string)$time,
    "_ClosingAllowableTime" => (string)$close
]);

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
// Output the result
// ===============================
if ($error) {
    echo json_encode(['error' => "cURL error: $error"]);
} else {
    echo $response ?: json_encode(['error' => "Empty response from Business Central (HTTP $httpCode)"]);
}
