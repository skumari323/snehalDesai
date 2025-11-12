<?php
header("Content-Type: application/json");


$geoUsername = 'skumari';


function callGeoNames($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        http_response_code(500);
        echo json_encode(['error' => curl_error($ch)]);
        exit;
    }
    curl_close($ch);
    return $response;
}


$action = $_GET['action'] ?? '';

switch ($action) {
    case 'address':
        $lat = $_GET['lat'] ?? '';
        $lng = $_GET['lng'] ?? '';
        $apiUrl = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=$lat&lng=$lng&username=$geoUsername";
        echo callGeoNames($apiUrl);
        break;

    case 'earthquakes':
        $north = $_GET['north'] ?? '';
        $south = $_GET['south'] ?? '';
        $east = $_GET['east'] ?? '';
        $west = $_GET['west'] ?? '';
        $minMag = $_GET['minMagnitude'] ?? '';
        $apiUrl = "http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&minMagnitude=$minMag&username=$geoUsername";
        echo callGeoNames($apiUrl);
        break;

    case 'weather':
        $lat = $_GET['lat'] ?? '';
        $lng = $_GET['lng'] ?? '';
        $apiUrl = "http://api.geonames.org/findNearByWeatherJSON?lat=$lat&lng=$lng&username=$geoUsername";
        echo callGeoNames($apiUrl);
        break;

    default:
        echo json_encode(['error' => 'Invalid API type']);
        break;
}
