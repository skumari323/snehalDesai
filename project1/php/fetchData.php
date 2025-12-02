<?php
header('Content-Type: application/json');

if (!isset($_POST['iso'])) {
    echo json_encode(['error' => 'No country ISO code provided']);
    exit;
}

$iso = $_POST['iso'];

// Load country borders GeoJSON
$geoJsonFile = __DIR__ . '/../data/countryBorders.geo.json';
$geoData = json_decode(file_get_contents($geoJsonFile), true);

// ISO3 to ISO2 mapping (same as before)
$iso3to2 = [
    "AFG"=>"AF","ALB"=>"AL","DZA"=>"DZ","AND"=>"AD","AGO"=>"AO","ARG"=>"AR",
    "ARM"=>"AM","AUS"=>"AU","AUT"=>"AT","AZE"=>"AZ","BHS"=>"BS","BHR"=>"BH","BGD"=>"BD",
    "BRB"=>"BB","BLR"=>"BY","BEL"=>"BE","BLZ"=>"BZ","BEN"=>"BJ","BTN"=>"BT","BOL"=>"BO",
    "BIH"=>"BA","BWA"=>"BW","BRA"=>"BR","BRN"=>"BN","BGR"=>"BG","BFA"=>"BF","BDI"=>"BI",
    "CPV"=>"CV","KHM"=>"KH","CMR"=>"CM","CAN"=>"CA","CAF"=>"CF","TCD"=>"TD","CHL"=>"CL",
    "CHN"=>"CN","COL"=>"CO","COM"=>"KM","COG"=>"CG","CRI"=>"CR","HRV"=>"HR","CUB"=>"CU",
    "CYP"=>"CY","CZE"=>"CZ","COD"=>"CD","DNK"=>"DK","DJI"=>"DJ","DMA"=>"DM","DOM"=>"DO",
    "ECU"=>"EC","EGY"=>"EG","SLV"=>"SV","GNQ"=>"GQ","ERI"=>"ER","EST"=>"EE","SWZ"=>"SZ",
    "ETH"=>"ET","FJI"=>"FJ","FIN"=>"FI","FRA"=>"FR","GAB"=>"GA","GMB"=>"GM","GEO"=>"GE",
    "DEU"=>"DE","GHA"=>"GH","GRC"=>"GR","GRD"=>"GD","GTM"=>"GT","GIN"=>"GN","GNB"=>"GW",
    "GUY"=>"GY","HTI"=>"HT","HND"=>"HN","HUN"=>"HU","ISL"=>"IS","IND"=>"IN","IDN"=>"ID",
    "IRN"=>"IR","IRQ"=>"IQ","IRL"=>"IE","ISR"=>"IL","ITA"=>"IT","JAM"=>"JM","JPN"=>"JP",
    "JOR"=>"JO","KAZ"=>"KZ","KEN"=>"KE","KIR"=>"KI","PRK"=>"KP","KOR"=>"KR","KWT"=>"KW",
    "KGZ"=>"KG","LAO"=>"LA","LVA"=>"LV","LBN"=>"LB","LSO"=>"LS","LBR"=>"LR","LBY"=>"LY",
    "LIE"=>"LI","LTU"=>"LT","LUX"=>"LU","MDG"=>"MG","MWI"=>"MW","MYS"=>"MY","MDV"=>"MV",
    "MLI"=>"ML","MLT"=>"MT","MHL"=>"MH","MRT"=>"MR","MUS"=>"MU","MEX"=>"MX","FSM"=>"FM",
    "MDA"=>"MD","MCO"=>"MC","MNG"=>"MN","MNE"=>"ME","MAR"=>"MA","MOZ"=>"MZ","MMR"=>"MM",
    "NAM"=>"NA","NRU"=>"NR","NPL"=>"NP","NLD"=>"NL","NZL"=>"NZ","NIC"=>"NI","NER"=>"NE",
    "NGA"=>"NG","NOR"=>"NO","OMN"=>"OM","PAK"=>"PK","PLW"=>"PW","PSE"=>"PS","PAN"=>"PA",
    "PNG"=>"PG","PRY"=>"PY","PER"=>"PE","PHL"=>"PH","POL"=>"PL","PRT"=>"PT","QAT"=>"QA",
    "ROU"=>"RO","RUS"=>"RU","RWA"=>"RW","KNA"=>"KN","LCA"=>"LC","VCT"=>"VC","WSM"=>"WS",
    "SMR"=>"SM","STP"=>"ST","SAU"=>"SA","SEN"=>"SN","SRB"=>"RS","SYC"=>"SC","SLE"=>"SL",
    "SGP"=>"SG","SVK"=>"SK","SVN"=>"SI","SLB"=>"SB","SOM"=>"SO","ZAF"=>"ZA","SSD"=>"SS",
    "ESP"=>"ES","LKA"=>"LK","SDN"=>"SD","SUR"=>"SR","SWE"=>"SE","CHE"=>"CH","SYR"=>"SY",
    "TJK"=>"TJ","TZA"=>"TZ","THA"=>"TH","TLS"=>"TL","TGO"=>"TG","TON"=>"TO","TTO"=>"TT",
    "TUN"=>"TN","TUR"=>"TR","TKM"=>"TM","UGA"=>"UG","UKR"=>"UA","ARE"=>"AE","GBR"=>"GB",
    "USA"=>"US","URY"=>"UY","UZB"=>"UZ","VUT"=>"VU","VEN"=>"VE","VNM"=>"VN","YEM"=>"YE",
    "ZMB"=>"ZM","ZWE"=>"ZW"
];

// Find GeoJSON and country name
$countryBorder = null;
$countryName = '';
foreach($geoData['features'] as $feature){
    $iso3 = $feature['id'] ?? '';
    if(($iso3to2[$iso3] ?? '') === $iso){
        $countryBorder = json_encode($feature);
        $countryName = $feature['properties']['name'] ?? '';
        break;
    }
}

// Fetch data from REST Countries API
$restUrl = "https://restcountries.com/v3.1/alpha/{$iso}";
$restData = file_get_contents($restUrl);
$restData = json_decode($restData, true);

if (!$restData || !isset($restData[0])) {
    echo json_encode(['error' => 'Country data not found']);
    exit;
}

$countryInfo = $restData[0];

// Extract capital, population, currency
$capital = $countryInfo['capital'][0] ?? '';
$population = $countryInfo['population'] ?? '';
$currencyCodes = array_keys($countryInfo['currencies'] ?? []);
$currency = $currencyCodes[0] ?? '';

// Capital coordinates
$capitalLat = $countryInfo['capitalInfo']['latlng'][0] ?? null;
$capitalLng = $countryInfo['capitalInfo']['latlng'][1] ?? null;

// Return JSON
echo json_encode([
    'border' => $countryBorder,
    'name' => $countryName,
    'capital' => $capital,
    'population' => $population,
    'currency' => $currency,
    'capitalLat' => $capitalLat,
    'capitalLng' => $capitalLng
]);








