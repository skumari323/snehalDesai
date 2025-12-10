<?php
header('Content-Type: application/json');

$country = isset($_GET['country']) ? $_GET['country'] : '';
if (!$country) {
    echo json_encode(['results'=>[], 'error'=>'Country code is missing']);
    exit;
}

// Your NewsData.io API key
$apiKey = 'pub_999441ff51904852b903af16c15472c8';

// NewsData API URL
$apiUrl = "https://newsdata.io/api/1/news?apikey={$apiKey}&country={$country}&language=en";

// Fetch news
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
if(curl_errno($ch)){
    echo json_encode(['results'=>[], 'error'=>'Curl error: '.curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

// Decode the API response
$data = json_decode($response, true);
if (!$data || !isset($data['results'])) {
    echo json_encode(['results'=>[], 'error'=>'No news found']);
    exit;
}

// Build simplified array for JS
$news = [];
foreach($data['results'] as $article){
    $news[] = [
        'title' => $article['title'] ?? 'No title',
        'link' => $article['link'] ?? '#'
    ];
}

// Return JSON
echo json_encode(['results'=>$news]);







