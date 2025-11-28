<?php
header('Content-Type: application/json');

$geoFile = __DIR__ . "/../data/countryBorders.geo.json";

if (!file_exists($geoFile)) {
    echo json_encode(["error" => "GeoJSON file not found"]);
    exit;
}

$geoJSON = file_get_contents($geoFile);
$data = json_decode($geoJSON, true);

if (!$data) {
    echo json_encode(["error" => "Failed to decode GeoJSON"]);
    exit;
}

echo json_encode($data);
?>






