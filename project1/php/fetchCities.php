<?php
header('Content-Type: application/json');

if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
    echo json_encode([]);
    exit;
}

$lat = floatval($_GET['lat']);
$lng = floatval($_GET['lng']);

// Example POIs near the capital (for demo purposes)
$pois = [
    ['name' => 'Main Museum', 'lat' => $lat + 0.01, 'lng' => $lng + 0.01, 'summary' => 'Famous local museum.'],
    ['name' => 'Central Park', 'lat' => $lat - 0.01, 'lng' => $lng - 0.01, 'summary' => 'Beautiful city park.'],
    ['name' => 'Historic Monument', 'lat' => $lat + 0.02, 'lng' => $lng - 0.02, 'summary' => 'Historic landmark.']
];

echo json_encode($pois);







