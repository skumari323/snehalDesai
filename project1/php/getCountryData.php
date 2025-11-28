<?php
header('Content-Type: application/json');

if (!isset($_GET['iso']) || empty($_GET['iso'])) {
    echo json_encode(["error" => "No ISO code provided"]);
    exit;
}

$iso = $_GET['iso']; // ISO3 code, e.g., "AFG"

// OpenCage API key
$apiKey = "66ceb2a04c0d4053b81eb4392555406a";

// Fetch country data from OpenCage
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.opencagedata.com/geocode/v1/json?q={$iso}&key={$apiKey}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (!$data) {
    echo json_encode(["error" => "Failed to fetch data from OpenCage"]);
    exit;
}

$result = [
    "iso" => $iso,
    "formatted" => $data['results'][0]['formatted'] ?? "",
    "geometry" => $data['results'][0]['geometry'] ?? [],
];

echo json_encode($result);
?>







