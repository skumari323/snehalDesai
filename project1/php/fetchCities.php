<?php
if (!isset($_GET['country'])) {
    echo json_encode(['error' => 'No country code provided']);
    exit;
}

$country = $_GET['country'];
$username = 'skumari';


$url = "http://api.geonames.org/searchJSON?country=$country&featureClass=P&maxRows=1000&username=$username&orderby=population";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
curl_close($ch);

header('Content-Type: application/json');
echo $response;

