<?php
header('Content-Type: application/json');

if(!isset($_POST['country'])){
    echo json_encode(['error'=>'No country provided']);
    exit;
}

$country = urlencode($_POST['country']);
$url = "https://en.wikipedia.org/api/rest_v1/page/summary/{$country}";

$response = file_get_contents($url);
if(!$response){
    echo json_encode(['error'=>'Failed to fetch Wikipedia']);
    exit;
}

$data = json_decode($response, true);
echo json_encode(['url'=>$data['content_urls']['desktop']['page'] ?? '']);
