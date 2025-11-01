<?php
// Business Central Token Handler

require_once __DIR__ . '/../vendor/autoload.php';
use Dotenv\Dotenv;

// Load .env file
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Environment variables
$tenantId = $_ENV['TENANT_ID'];
$clientId = $_ENV['CLIENT_ID'];
$clientSecret = $_ENV['CLIENT_SECRET'];
$scope = $_ENV['SCOPE'] ?? 'https://api.businesscentral.dynamics.com/.default';

// Cache file to store the token
$cacheFile = __DIR__ . '/token_cache.json';

// Check if token exists and still valid
if (file_exists($cacheFile)) {
    $cache = json_decode(file_get_contents($cacheFile), true);
    if (isset($cache['access_token'], $cache['expires_at']) && time() < $cache['expires_at']) {
        // ✅ Token still valid — return it
        if (php_sapi_name() !== 'cli' && basename($_SERVER['SCRIPT_NAME']) === 'get_token.php') {
            header('Content-Type: application/json');
            echo json_encode(['access_token' => $cache['access_token']]);
            exit;
        }
        return $cache;
    }
}

// Token expired or missing — request new one
$url = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token";

$data = http_build_query([
    'grant_type' => 'client_credentials',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'scope' => $scope
]);

$options = [
    'http' => [
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => $data
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to request access token']);
    exit;
}

$result = json_decode($response, true);

if (!isset($result['access_token'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token response', 'details' => $result]);
    exit;
}

// Cache the token
$expiresAt = time() + $result['expires_in'] - 60; // minus 60s buffer
file_put_contents($cacheFile, json_encode([
    'access_token' => $result['access_token'],
    'expires_at' => $expiresAt
]));

if (php_sapi_name() !== 'cli' && basename($_SERVER['SCRIPT_NAME']) === 'get_token.php') {
    // If called directly (like in Postman)
    header('Content-Type: application/json');
    echo json_encode(['access_token' => $result['access_token']]);
    exit;
}

// If included in another PHP file, just return the data
return [
    'access_token' => $result['access_token'],
    'expires_at' => $expiresAt
];
