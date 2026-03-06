// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: './css/images/marker-icon.png',
    iconRetinaUrl: './css/images/marker-icon-2x.png',
    shadowUrl: './css/images/marker-shadow.png'
});






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
    }).fail(function(){
        console.error("Failed to load countries");
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

    cityLayer.clearLayers();
    weatherLayer.clearLayers();

    $.getJSON("php/getCountryBorders.php",{code},function(json){

        if(countryBorderLayer){
            map.removeLayer(countryBorderLayer);
        }

        if(json){
            countryBorderLayer = L.geoJSON(json,{
                color:"yellow",
                weight:2
            }).addTo(map);

            map.fitBounds(countryBorderLayer.getBounds());
        }

    }).fail(function(){
        console.error("Failed to load country border");
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

        if(info.capital && info.capitalInfo && info.capitalInfo.latlng){
            const [lat, lng] = info.capitalInfo.latlng;
            fetchWeather(lat, lng);
        }

    }).fail(function(){
        alert("Failed to load country information");
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
            L.marker([lat,lng])
            .bindPopup(`${city.name}`)
            .addTo(cityLayer);
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

        weatherLayer.clearLayers();

        L.marker([lat,lng])
        .bindPopup(`
            <b>Current Weather</b><br>
            ${data.current.temp} °C<br>
            ${data.current.desc}
        `)
        .addTo(weatherLayer);

        $("#weatherIcon").attr("src", data.current.icon);

        $("#currentTemp").text(data.current.temp + " °C");
        $("#currentDesc").text(data.current.desc);

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

    }).fail(function(){
        alert("Failed to fetch weather data");
    });
}

/* CURRENCY */
function populateCurrency(currency){

    $("#fromCurrency").empty();
    $("#toCurrency").empty();

    $("#fromCurrency").append(`<option>${currency}</option>`);

    const commonCurrencies = ["USD","EUR","GBP","JPY","AUD"];

    commonCurrencies.forEach(cur=>{
        $("#toCurrency").append(`<option>${cur}</option>`);
    });

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

    }).fail(function(){
        $("#convertedResult").text("Exchange rate unavailable.");
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

/* NEWS */
function loadLocalNews(code){

    $("#newsModalBody").html("<p>Loading news...</p>");

    $.getJSON("php/getLocalnews.php",{country:code},function(data){

        const container = $("#newsModalBody").empty();

        if(!data || !data.articles || !data.articles.length){
            container.append("<p>No news available.</p>");
            return;
        }

        data.articles.slice(0,5).forEach(article=>{

            container.append(`
                <div class="mb-3">
                    <a href="${article.url}" target="_blank">
                        <strong>${article.title}</strong>
                    </a>
                    <p>${article.description || ""}</p>
                </div>
            `);

        });

        $("#newsModal").modal("show");

    }).fail(()=>{

        $("#newsModalBody").html("<p>Failed to load news.</p>");
        $("#newsModal").modal("show");

    });

}

/* EASY BUTTONS */
L.easyButton('<i class="fa-solid fa-circle-info"></i>', () => $("#infoModal").modal("show")).addTo(map);

L.easyButton('<i class="fa-solid fa-house"></i>', function(){
    if(homeCountry) $("#countrySelect").val(homeCountry).change();
}).addTo(map);

L.easyButton('<i class="fa-solid fa-cloud"></i>', function(){
    if(!currentCountryInfo) return alert("Select a country first");
    if(currentCountryInfo.capitalInfo && currentCountryInfo.capitalInfo.latlng){
        const [lat,lng] = currentCountryInfo.capitalInfo.latlng;
        fetchWeather(lat,lng);
    }
}).addTo(map);

L.easyButton('<i class="fa-solid fa-newspaper"></i>', function(){
    const code = $("#countrySelect").val();
    if(code) loadLocalNews(code);
}).addTo(map);

L.easyButton('<i class="fa-solid fa-coins"></i>', () => $("#calculatorModal").modal("show")).addTo(map);

L.easyButton('<i class="fa-solid fa-calendar-days"></i>', function(){
    if(!currentCountryInfo) return alert("Select a country first");
    fetchPublicHolidays(currentCountryInfo.iso);
}).addTo(map);

/* USER LOCATION */
function detectUserCountry(){

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(showPosition, showError,{
            enableHighAccuracy:true,
            timeout:10000
        });

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