<?php
header('Content-Type: application/json');

if (!isset($_GET['lat']) || !isset($_GET['lng'])) {
    echo json_encode(['error' => 'No coordinates provided']);
    exit;
}

$lat = $_GET['lat'];
$lng = $_GET['lng'];

// OpenWeather API key
$apiKey = "bc0563fee69bbaa438597448d47360fc";

// Current weather
$weatherUrl = "https://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lng}&units=metric&appid={$apiKey}";
// 5-day forecast
$forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?lat={$lat}&lon={$lng}&units=metric&appid={$apiKey}";

// Fetch data
$weatherData = @file_get_contents($weatherUrl);
$forecastData = @file_get_contents($forecastUrl);

$weatherData = json_decode($weatherData, true);
$forecastData = json_decode($forecastData, true);

if (!$weatherData || !$forecastData || !isset($weatherData['weather'][0])) {
    echo json_encode(['error' => 'Weather data not found']);
    exit;
}

// Current weather
$current = [
    'temp' => $weatherData['main']['temp'] ?? '',
    'desc' => $weatherData['weather'][0]['description'] ?? '',
    'icon' => "http://openweathermap.org/img/wn/" . ($weatherData['weather'][0]['icon'] ?? '01d') . ".png"
];

// Forecast: take 5 entries at 12:00:00 each day
$forecast = [];
if (isset($forecastData['list'])) {
    foreach ($forecastData['list'] as $item) {
        if (strpos($item['dt_txt'], '12:00:00') !== false) {
            $forecast[] = [
                'day' => date('D', strtotime($item['dt_txt'])),
                'temp' => $item['main']['temp'],
                'desc' => $item['weather'][0]['main'],
                'icon' => "http://openweathermap.org/img/wn/" . $item['weather'][0]['icon'] . ".png"
            ];
            if (count($forecast) >= 5) break;
        }
    }
}

echo json_encode([
    'current' => $current,
    'forecast' => $forecast
]);





