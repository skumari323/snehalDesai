<?php

// Enable error display (remove in production)
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Required API parameter
$api = $_GET['api'] ?? '';

$username = "skumari";   // <-- your GeoNames username


switch ($api) {

    // ---------------------------------------------------
    // ADDRESS API
    // ---------------------------------------------------
    case 'address':

        if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
            echo json_encode([
                "status" => ["code" => "400", "description" => "Missing lat/lng"]
            ]);
            exit;
        }

        $lat = $_GET['lat'];
        $lng = $_GET['lng'];

        $url = "http://api.geonames.org/addressJSON?lat=$lat&lng=$lng&username=$username";

        break;


    // ---------------------------------------------------
    // EARTHQUAKE API
    // ---------------------------------------------------
    case 'earthquakes':

        if (!isset($_GET['north'], $_GET['south'], $_GET['east'], $_GET['west'])) {
            echo json_encode([
                "status" => ["code" => "400", "description" => "Missing bounding box parameters"]
            ]);
            exit;
        }

        $north = $_GET['north'];
        $south = $_GET['south'];
        $east  = $_GET['east'];
        $west  = $_GET['west'];

        $url = "http://api.geonames.org/earthquakesJSON?north=$north&south=$south&east=$east&west=$west&username=$username";

        break;


    // ---------------------------------------------------
    // WEATHER API
    // ---------------------------------------------------
    case 'weather':

        if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
            echo json_encode([
                "status" => ["code" => "400", "description" => "Missing lat/lng"]
            ]);
            exit;
        }

        $lat = $_GET['lat'];
        $lng = $_GET['lng'];

        $url = "http://api.geonames.org/findNearByWeatherJSON?lat=$lat&lng=$lng&username=$username";

        break;


    // ---------------------------------------------------
    // INVALID API REQUEST
    // ---------------------------------------------------
    default:
        echo json_encode([
            "status" => [
                "code" => "400",
                "description" => "Invalid API parameter. Use ?api=address OR ?api=earthquakes OR ?api=weather"
            ]
        ]);
        exit;
}


// ---------------------------------------------------
// CURL REQUEST
// ---------------------------------------------------

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);
curl_close($ch);

$decode = json_decode($result, true);


// ---------------------------------------------------
// OUTPUT FORMAT
// ---------------------------------------------------

$output = [];
$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";

$output['data'] = $decode;

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);

?>