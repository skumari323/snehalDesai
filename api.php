<?php
header('Content-Type: application/json');


$username = 'skumari';


$type = isset($_GET['type']) ? $_GET['type'] : '';

function callGeoNamesAPI($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);

    if(curl_errno($ch)){
        echo json_encode(['error' => curl_error($ch)]);
        curl_close($ch);
        exit;
    }

    curl_close($ch);
    return $response;
}

switch($type) {
    case 'address':
        $lat = $_GET['lat'];
        $lng = $_GET['lng'];
        $url = "http://api.geonames.org/findNearestAddressJSON?lat=$lat&lng=$lng&username=skumari";
        echo callGeoNamesAPI($url);
        break;

    case 'earthquakes':
        $north = $_GET['north'];
        $south = $_GET['south'];
        $east = $_GET['east'];
        $west = $_GET['west'];
        $minMag = $_GET['minMag'];
        $url = "http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&minMagnitude=$minMag&username=skumari";
        echo callGeoNamesAPI($url);
        break;

    case 'weather':
        $lat = $_GET['lat'];
        $lng = $_GET['lng'];
        $url = "http://api.geonames.org/findNearByWeatherJSON?lat=$lat&lng=$lng&username=skumari";
        echo callGeoNamesAPI($url);
        break;

    default:
        echo json_encode(['error' => 'Invalid API type']);
}
?>
