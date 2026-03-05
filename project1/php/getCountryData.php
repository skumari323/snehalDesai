<?php
header('Content-Type: application/json');

if (!isset($_GET['iso']) || empty($_GET['iso'])) {
    echo json_encode(["error" => "No ISO code provided"]);
    exit;
}

$iso = strtoupper($_GET['iso']);

/* REST Countries API */
$url = "https://restcountries.com/v3.1/alpha/{$iso}";
$response = @file_get_contents($url);

$data = json_decode($response, true);

if (!$data || !isset($data[0])) {
    echo json_encode(["error" => "Country data not found"]);
    exit;
}

$country = $data[0];

/* Capital & Coordinates */
$capital = $country['capital'][0] ?? "N/A";
$capitalLat = $country['capitalInfo']['latlng'][0] ?? null;
$capitalLng = $country['capitalInfo']['latlng'][1] ?? null;

/* Population */
$population = $country['population'] ?? "N/A";

/* Currency */
$currency = "N/A";
if (isset($country['currencies'])) {
    $currency = array_key_first($country['currencies']);
}

/* Wikipedia link */
$name = $country['name']['common'] ?? "";
$wiki = "https://en.wikipedia.org/wiki/" . urlencode($name);

/* Return exactly what JS expects */
echo json_encode([
    "capital" => $capital,
    "capital_lat" => $capitalLat,
    "capital_lng" => $capitalLng,
    "population" => $population,
    "currency" => $currency,
    "wiki" => $wiki,
    "cities" => [] // keep your city array logic if needed
]);