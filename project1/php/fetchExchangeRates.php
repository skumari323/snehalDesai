<?php
header('Content-Type: application/json');

// ------------------------------
// Validate input
// ------------------------------
if (!isset($_GET['currency']) || empty($_GET['currency'])) {
    echo json_encode(['error' => 'No currency provided']);
    exit;
}

$currency = strtoupper($_GET['currency']);

// ------------------------------
// Your ExchangeRate-API key
// ------------------------------
$apiKey = "f3676a6974414e3c8d5c2c3f94de0884";
$url = "https://v6.exchangerate-api.com/v6/{$apiKey}/latest/{$currency}";

// ------------------------------
// Fetch exchange rates safely
// ------------------------------
$options = [
    "http" => [
        "method" => "GET",
        "timeout" => 5, // seconds
        "header" => "User-Agent: PHP\r\n"
    ]
];
$context = stream_context_create($options);

$response = @file_get_contents($url, false, $context);

if (!$response) {
    echo json_encode(['error' => "Failed to fetch exchange rates for currency: $currency"]);
    exit;
}

// ------------------------------
// Decode JSON safely
// ------------------------------
$data = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['error' => 'Invalid JSON response from exchange rate API']);
    exit;
}

// Check API success
if (!isset($data['result']) || $data['result'] !== 'success') {
    echo json_encode(['error' => 'Exchange rate API returned an error']);
    exit;
}

// ------------------------------
// USD conversion
// ------------------------------
$rateUSD = $data['conversion_rates']['USD'] ?? null;

if ($rateUSD === null) {
    echo json_encode(['error' => "Exchange rate to USD not available for currency: $currency"]);
    exit;
}

// ------------------------------
// Return JSON
// ------------------------------
echo json_encode(['rateUSD' => $rateUSD]);
exit;








