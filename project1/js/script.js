let map = L.map("map").setView([20,0],2);

let cityLayer = L.markerClusterGroup();
let weatherLayer = L.layerGroup();
let countryBorderLayer = null;
let currentCountryInfo = null;
let homeCountry = null;

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19}).addTo(map);
const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{maxZoom:17});

cityLayer.addTo(map);
weatherLayer.addTo(map);

const baseMaps = {
    "OpenStreetMap": osm,
    "Topo Map": topo
};

const overlayMaps = {
    "Cities": cityLayer,
    "Weather": weatherLayer
};

L.control.layers(baseMaps, overlayMaps, {collapsed:false}).addTo(map);

/* LOAD COUNTRIES */
$(document).ready(function(){
    $.getJSON("php/getCountries.php", function(countries){
        countries.forEach(country=>{
            if(country.iso_a2){
                $("#countrySelect").append(`<option value="${country.iso_a2}">${country.name}</option>`);
            }
        });
        detectUserCountry();
    });
});

/* COUNTRY CHANGE */
$("#countrySelect").on("change", function(){
    const code = $(this).val();
    if(!code) return;
    loadCountryBorder(code);
    loadCountryInfo(code);
});

/* COUNTRY BORDER */
function loadCountryBorder(code){
    $.getJSON("php/getCountryBorders.php",{code},function(json){
        if(countryBorderLayer) map.removeLayer(countryBorderLayer);
        countryBorderLayer = L.geoJSON(json,{color:"yellow",weight:2}).addTo(map);
        map.fitBounds(countryBorderLayer.getBounds());
    });
}

/* COUNTRY INFO */
function loadCountryInfo(code){
    $.getJSON("php/getCountryData.php",{iso:code},function(info){
        currentCountryInfo = {...info, iso:code};

        $("#capital").text(info.capital || "N/A");
        $("#population").text(info.population || "N/A");
        $("#currency").text(info.currency || "N/A");
        $("#wikiLink").attr("href", info.wiki || "#");

        populateCurrency(info.currency);
        loadCountryMarkers();

        // Fetch weather using capital coordinates
        if(info.capital && info.capitalInfo && info.capitalInfo.latlng){
            const [lat, lng] = info.capitalInfo.latlng;
            fetchWeather(lat, lng);
        }
    });
}

/* CITY MARKERS */
function loadCountryMarkers(){
    cityLayer.clearLayers();
    if(!currentCountryInfo || !currentCountryInfo.cities) return;

    currentCountryInfo.cities.slice(0,500).forEach(city=>{
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);
        if(!isNaN(lat) && !isNaN(lng)){
            L.marker([lat,lng]).bindPopup(`${city.name}`).addTo(cityLayer);
        }
    });
}

/* WEATHER */
function fetchWeather(lat, lng){
    $.getJSON("php/fetchWeather.php", {lat, lng}, function(data){
        if(data.error){
            alert(data.error);
            return;
        }

        // LEFT ICON
        $("#weatherIcon").attr("src", data.current.icon);

        // CURRENT WEATHER
        $("#currentTemp").text(data.current.temp + " °C");
        $("#currentDesc").text(data.current.desc);

        // FORECAST
        $("#forecastContainer").empty();
        if(data.forecast){
            data.forecast.forEach(day=>{
                const card=`
                <div class="card p-2 text-center" style="width:90px">
                    <p>${day.day}</p>
                    <img src="${day.icon}" style="width:40px">
                    <p>${day.temp}°C</p>
                </div>`;
                $("#forecastContainer").append(card);
            });
        }

        $("#weatherModal").modal("show");
    });
}

/* CURRENCY */
function populateCurrency(currency){
    $("#fromCurrency").empty();
    $("#toCurrency").empty();

    $("#fromCurrency").append(`<option>${currency}</option>`);
    $("#toCurrency").append(`<option>USD</option>`);
}

$("#calculateBtn").on("click", function(){
    if(!currentCountryInfo) return;

    const amount = parseFloat($("#amountInput").val());
    if(isNaN(amount) || amount <= 0){
        $("#convertedResult").text("Enter a valid amount.");
        return;
    }

    const from = $("#fromCurrency").val();
    const to = $("#toCurrency").val();

    $.getJSON("php/fetchExchangeRates.php",{from,to}, function(data){
        const result = amount * data.rate;
        $("#convertedResult").text(`${amount} ${from} = ${result.toFixed(2)} ${to}`);
    });
});

/* PUBLIC HOLIDAYS */
function fetchPublicHolidays(code){
    $("#holidaysModalBody").html("<p>Loading holidays...</p>");
    $.getJSON(`php/getPublicHolidays.php?country=${code}`, function(data){
        const container = $("#holidaysModalBody").empty();
        if(!data || !data.length){
            container.append("<p>No public holidays available.</p>");
            return;
        }
        const list = $("<ul class='list-group'></ul>");
        data.forEach(holiday=>{
            list.append(`<li class='list-group-item'>${holiday.date} - ${holiday.localName}</li>`);
        });
        container.append(list);
        $("#holidaysModal").modal("show");
    }).fail(()=>{
        $("#holidaysModalBody").html("<p>Failed to load public holidays.</p>");
        $("#holidaysModal").modal("show");
    });
}

/* EASY BUTTONS */
L.easyButton("fa-info",()=>$("#infoModal").modal("show")).addTo(map);
L.easyButton("fa-home",function(){if(homeCountry) $("#countrySelect").val(homeCountry).change();}).addTo(map);
L.easyButton("fa-cloud",function(){if(!currentCountryInfo) return alert("Select a country first"); 
    // use capital coordinates
    if(currentCountryInfo.capital && currentCountryInfo.capitalInfo && currentCountryInfo.capitalInfo.latlng){
        const [lat,lng] = currentCountryInfo.capitalInfo.latlng;
        fetchWeather(lat,lng);
    }
}).addTo(map);
L.easyButton("fa-newspaper",function(){const code=$("#countrySelect").val(); if(code) loadLocalNews(code);}).addTo(map);
L.easyButton("fa-coins",()=>$("#calculatorModal").modal("show")).addTo(map);
L.easyButton("fa-calendar-days",function(){if(!currentCountryInfo)return alert("Select a country first"); fetchPublicHolidays(currentCountryInfo.iso);}).addTo(map);

/* USER LOCATION */
function detectUserCountry(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }
}

function showPosition(position){
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    $.ajax({
        url:"php/getCountryFromCoords.php",
        type:"POST",
        dataType:"json",
        data:{lat,lng},
        success:function(result){
            if(result.status.name==="ok"){
                const countryCode = result.data.countryCode;
                homeCountry = countryCode;
                $("#countrySelect").val(countryCode).change();
            }
        }
    });
}

function showError(error){
    console.log("Geolocation error: " + error.message);
}

$(window).on("load", function(){
    $("#pre-load").fadeOut(500);
});

