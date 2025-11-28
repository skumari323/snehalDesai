<?php
header('Content-Type: application/json');

if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
    echo json_encode(["error" => "No coordinates provided"]);
    exit;
}

$lat = $_GET['lat'];
$lng = $_GET['lng'];
$apiKey = "66ceb2a04c0d4053b81eb4392555406a";


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.opencagedata.com/geocode/v1/json?q={$lat}+{$lng}&key={$apiKey}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (!isset($data['results'][0]['components']['ISO_3166-1_alpha-3'])) {
    echo json_encode(["error" => "Country not found"]);
    exit;
}

$iso3 = $data['results'][0]['components']['ISO_3166-1_alpha-3'];

echo json_encode(["iso" => $iso3]);
?>







