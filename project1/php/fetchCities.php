<?php
header('Content-Type: application/json');

if (!isset($_POST['iso'])) {
    echo json_encode([]);
    exit;
}

$iso = $_POST['iso'];

// Mock cities data: replace with real API or database
$cities = [
    ['name' => 'City A', 'lat' => 10.0, 'lng' => 20.0, 'population' => 500000],
    ['name' => 'City B', 'lat' => 12.0, 'lng' => 22.0, 'population' => 200000],
    ['name' => 'City C', 'lat' => 11.5, 'lng' => 21.5, 'population' => 100000]
];

echo json_encode($cities);




