<?php
header('Content-Type: application/json');

// Get country code and year from GET parameters
$country = isset($_GET['country']) ? $_GET['country'] : '';
$year = isset($_GET['year']) ? $_GET['year'] : date('Y');

// Validate input
if (!$country) {
    echo json_encode(['error' => 'Country code is required']);
    exit;
}

// Your API key
$apiKey = '19T7n77iUpFMky4koyOLkuo5nzPX58pt';

// Public holidays API endpoint
$url = "https://calendarific.com/api/v2/holidays?api_key=$apiKey&country=$country&year=$year";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(['error' => 'cURL error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

if ($http_code !== 200) {
    echo json_encode(['error' => 'Failed to fetch holidays, HTTP code: ' . $http_code]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Return the API response directly
echo $response;
?>

