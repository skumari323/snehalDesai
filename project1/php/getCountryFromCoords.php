<?php

header('Content-Type: application/json; charset=UTF-8');

$lat = $_POST['lat'] ?? null;
$lng = $_POST['lng'] ?? null;

if (!$lat || !$lng) {
    echo json_encode([
        'status' => [
            'code' => 400,
            'name' => 'error',
            'message' => 'Missing coordinates'
        ]
    ]);
    exit;
}

// 🔑 Your GeoNames username
$username = 'skumari';

$url = "http://api.geonames.org/countryCodeJSON?lat={$lat}&lng={$lng}&username={$username}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$response = curl_exec($ch);
curl_close($ch);

if (!$response) {
    echo json_encode([
        'status' => [
            'code' => 500,
            'name' => 'error',
            'message' => 'GeoNames request failed'
        ]
    ]);
    exit;
}

$data = json_decode($response, true);

if (!isset($data['countryCode'])) {
    echo json_encode([
        'status' => [
            'code' => 500,
            'name' => 'error',
            'message' => 'Country code not found'
        ]
    ]);
    exit;
}

echo json_encode([
    'status' => [
        'code' => 200,
        'name' => 'ok',
        'message' => 'success'
    ],
    'data' => [
        'countryCode' => $data['countryCode']
    ]
]);