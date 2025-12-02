<?php
header('Content-Type: application/json');

// Get POST data
$city = isset($_POST['city']) ? trim($_POST['city']) : '';
$country = isset($_POST['iso']) ? trim($_POST['iso']) : '';

if (!$city || !$country) {
    echo json_encode(['error' => 'City or country code missing']);
    exit;
}

// OpenWeather API key
$apiKey = "bc0563fee69bbaa438597448d47360fc";

// Build API URL
$cityEncoded = urlencode($city);
$countryEncoded = urlencode($country);
$url = "https://api.openweathermap.org/data/2.5/weather?q={$cityEncoded},{$countryEncoded}&appid={$apiKey}&units=metric";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Decode response
$data = json_decode($response, true);

// Check API response
if (!isset($data['cod']) || $data['cod'] != 200) {
    $message = isset($data['message']) ? $data['message'] : 'Unknown error';
    echo json_encode(['error' => $message]);
    exit;
}

// Extract weather info
$weatherDescription = isset($data['weather'][0]['description']) ? ucfirst($data['weather'][0]['description']) : 'Unavailable';
$temp = isset($data['main']['temp']) ? $data['main']['temp'] : 'N/A';

// Return JSON
echo json_encode([
    'description' => $weatherDescription,
    'temp' => $temp
]);

