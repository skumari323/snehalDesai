<?php
header('Content-Type: application/json');

function curl_get($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

if (!isset($_GET["iso"])) {
    echo json_encode(["error" => "Missing ISO code"]);
    exit;
}

$iso = strtoupper($_GET["iso"]);

// ------------------------------
// 1) COUNTRY INFO
// ------------------------------
$restData = curl_get("https://restcountries.com/v3.1/alpha/$iso");
$rest = json_decode($restData, true)[0] ?? null;

if (!$rest) {
    echo json_encode(["error" => "Failed to fetch country data"]);
    exit;
}

$countryName = $rest["name"]["common"] ?? "N/A";
$capital = $rest["capital"][0] ?? "N/A";
$population = $rest["population"] ?? null;
$currencies = $rest["currencies"] ?? [];
$currencyCode = key($currencies) ?? "N/A";
$latlng = $rest["capitalInfo"]["latlng"] ?? [null, null];
$lat = $latlng[0] ?? null;
$lng = $latlng[1] ?? null;

// ------------------------------
// 2) WEATHER
// ------------------------------
$weather = ["description" => "N/A", "temp" => "N/A"];
if ($lat !== null && $lng !== null) {
    $weatherKey = "YOUR_OPENWEATHER_API_KEY"; // replace with your key
    $weatherURL = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&units=metric&appid=$weatherKey";
    $weatherData = curl_get($weatherURL);
    $w = json_decode($weatherData, true);
    if ($w && isset($w["weather"][0]) && isset($w["main"]["temp"])) {
        $weather = [
            "description" => $w["weather"][0]["description"] ?? "N/A",
            "temp" => $w["main"]["temp"] ?? "N/A"
        ];
    }
}

// ------------------------------
// 3) EXCHANGE RATE (Open Exchange Rates)
// ------------------------------
$rateUSD = 1.0; // default to 1 if USD or API fails
if ($currencyCode && $currencyCode !== "USD" && $currencyCode !== "N/A") {
    $fxURL = "https://open.er-api.com/v6/latest/$currencyCode";
    $fxData = curl_get($fxURL);
    $fxJson = json_decode($fxData, true);
    if ($fxJson && isset($fxJson["rates"]["USD"])) {
        $rateUSD = floatval($fxJson["rates"]["USD"]);
    }
}

// ------------------------------
// 4) TOP CITIES (Geonames API)
// ------------------------------
$geonamesUser = "skumari";
$cityList = [];
$geoURL = "http://api.geonames.org/searchJSON?country=$iso&featureClass=P&maxRows=10&orderby=population&username=$geonamesUser";
$geoData = curl_get($geoURL);
$geoJson = json_decode($geoData, true);

if ($geoJson && isset($geoJson['geonames'])) {
    foreach ($geoJson['geonames'] as $city) {
        $cityList[] = [
            "name" => $city['name'],
            "lat" => $city['lat'],
            "lng" => $city['lng'],
            "population" => $city['population'] ?? null
        ];
    }
}

// ------------------------------
// 5) OUTPUT JSON
// ------------------------------
echo json_encode([
    "name" => $countryName,
    "capital" => $capital,
    "population" => $population,
    "currency" => $currencyCode,
    "capitalLat" => $lat,
    "capitalLng" => $lng,
    "weather" => $weather,
    "exchangeRate" => $rateUSD, // always a number now
    "wiki" => "https://en.wikipedia.org/wiki/" . urlencode($countryName),
    "cities" => $cityList
]);





