<?php
header('Content-Type: application/json');

if(!isset($_POST['currency'])){
    echo json_encode(['error'=>'No currency provided']);
    exit;
}

$currency = strtoupper($_POST['currency']);
$apiKey = 'f3676a6974414e3c8d5c2c3f94de0884'; // Optional if using open API
$url = "https://open.er-api.com/v6/latest/{$currency}"; // free API

$response = file_get_contents($url);
if(!$response){
    echo json_encode(['error'=>'Failed to fetch exchange rate']);
    exit;
}

$data = json_decode($response, true);
$rate = $data['rates']['USD'] ?? null;

if($rate){
    echo json_encode(['rateUSD'=>$rate]);
}else{
    echo json_encode(['error'=>'Exchange rate not found']);
}



