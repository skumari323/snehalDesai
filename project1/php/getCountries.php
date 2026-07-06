<?php
header('Content-Type: application/json; charset=UTF-8');

// Load GeoJSON file
$geoJsonFile = __DIR__ . '/../data/countryBorders.geo.json';
if (!file_exists($geoJsonFile)) {
    echo json_encode([
        'status' => ['code' => 500, 'name' => 'error', 'message' => 'GeoJSON file not found']
    ]);
    exit;
}

$geoData = json_decode(file_get_contents($geoJsonFile), true);
if (!$geoData || !isset($geoData['features'])) {
    echo json_encode([
        'status' => ['code' => 500, 'name' => 'error', 'message' => 'Invalid GeoJSON data']
    ]);
    exit;
}

// Build countries list from feature 'id' and 'name'
$countries = [];
foreach ($geoData['features'] as $feature) {
    $iso2 = strtoupper($feature['id'] ?? '');
    $name = $feature['properties']['name'] ?? 'Unknown';

    if (!$iso2) continue;

    $countries[] = [
        'iso_a2' => $iso2,
        'name' => $name,
        'lat' => $feature['properties']['latitude'] ?? null,
        'lng' => $feature['properties']['longitude'] ?? null
    ];
}

// Sort alphabetically by name
usort($countries, fn($a, $b) => strcmp($a['name'], $b['name']));

// Return JSON
echo json_encode([
    'status' => ['code' => 200, 'name' => 'ok', 'message' => 'Countries loaded successfully'],
    'data' => $countries
]);