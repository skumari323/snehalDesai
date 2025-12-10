// ===============================
// GLOBAL VARIABLES
// ===============================
let map = L.map("map").setView([20, 0], 2);
let cityLayer = L.markerClusterGroup();
let weatherLayer = L.layerGroup();
let countryBorderLayer = null;
let currentCountryInfo = null; // Currently selected country info
const API_KEY = "bc0563fee69bbaa438597448d47360fc"; // OpenWeatherMap API key

// ===============================
// INITIAL MAP SETUP
// ===============================
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

const overlayMaps = { "Cities": cityLayer, "Weather": weatherLayer };
L.control.layers(null, overlayMaps, { collapsed: false }).addTo(map);

$('<label><input type="checkbox" id="toggleCities" checked> Show Cities</label>').appendTo('#map');
$('#toggleCities').on('change', function() {
    this.checked ? map.addLayer(cityLayer) : map.removeLayer(cityLayer);
});

// ===============================
// LOAD COUNTRY LIST
// ===============================
$(document).ready(function () {
    $.ajax({
        url: "php/getCountries.php",
        dataType: "json",
        success: function(countries) {
            countries.forEach(c => {
                if(c.iso_a2) $("#countrySelect").append(`<option value="${c.iso_a2}">${c.name}</option>`);
            });
        },
        error: function(xhr) { console.error("Error fetching countries:", xhr.responseText); }
    });
});

// ===============================
// COUNTRY SELECTION HANDLER
// ===============================
$("#countrySelect").on("change", function () {
    const code = $(this).val();
    if (!code) return;

    loadCountryBorder(code);
    loadCountryInfo(code);
    loadCountryMarkers(code);
    loadLocalNews(code);
});

// ===============================
// LOAD COUNTRY BORDER
// ===============================
function loadCountryBorder(code) {
    $.ajax({
        url: "php/getCountryBorders.php",
        data: { code },
        dataType: "json",
        success: function(json) {
            if(json.error) { alert(json.error); return; }
            if(countryBorderLayer) map.removeLayer(countryBorderLayer);
            countryBorderLayer = L.geoJSON(json, { color: "yellow", weight: 2 }).addTo(map);
            map.fitBounds(countryBorderLayer.getBounds());
        },
        error: function(xhr) { console.error(xhr.responseText); }
    });
}

// ===============================
// LOAD COUNTRY INFO
// ===============================
function loadCountryInfo(code) {
    $.ajax({
        url: "php/fetchData.php",
        data: { iso: code },
        dataType: "json",
        success: function(info) {
            if(info.error) { alert(info.error); return; }

            currentCountryInfo = info; // Save globally

            // Update info modal
            $('#capital').text(info.capital || "N/A");
            $('#population').text(info.population?.toLocaleString() || "N/A");
            $('#currency').text(info.currency || "N/A");
            $('#exchangeRate').text(typeof info.exchangeRate==='number' ? info.exchangeRate.toFixed(4)+" USD" : "N/A");
            $('#wikiLink').attr('href', info.wiki || "#");

            // Clear layers
            cityLayer.clearLayers();
            weatherLayer.clearLayers();

            // Add capital marker
            if(info.capitalLat && info.capitalLng) {
                const icon = L.ExtraMarkers.icon({ icon: 'fa fa-star', markerColor: 'blue', shape: 'circle', prefix: 'fa' });
                L.marker([info.capitalLat, info.capitalLng], { icon })
                    .bindPopup(`<strong>${info.capital}</strong>`)
                    .addTo(cityLayer);
            }
            cityLayer.addTo(map);

            // Fetch weather for capital
            if(info.capital) fetchWeather(info.capital);
        },
        error: function(xhr) { console.error("Failed to load country info:", xhr.responseText); }
    });
}

// ===============================
// LOAD COUNTRY MARKERS
// ===============================
function loadCountryMarkers(code) {
    $.getJSON(`http://api.geonames.org/searchJSON?country=${code}&maxRows=50&username=skumari`, function(data){
        cityLayer.clearLayers();
        if(data.geonames){
            data.geonames.forEach(place => {
                const icon = L.icon({ iconUrl: 'images/city.png', iconSize: [30,30] });
                L.marker([place.lat, place.lng], { icon })
                 .bindPopup(`<strong>${place.name}</strong><br>${place.adminName1}`)
                 .addTo(cityLayer);
            });
        }
        cityLayer.addTo(map);
    });
}

// ===============================
// LOAD LOCAL NEWS
// ===============================
function loadLocalNews(code) {
    $.getJSON(`php/getLocalnews.php?country=${code}`, function(data){
        $('#newsModalBody').empty();
        if(!data || !data.results || !data.results.length){
            $('#newsModalBody').append(`<p>No news available</p>`);
        } else {
            data.results.forEach(article => {
                $('#newsModalBody').append(`<div class="news-item mb-2"><a href="${article.link}" target="_blank">${article.title}</a></div>`);
            });
        }
        $('#newsModal').modal('show');
    }).fail(function(){
        $('#newsModalBody').empty().append(`<p>Failed to load news.</p>`);
        $('#newsModal').modal('show');
    });
}

// ===============================
// CURRENT LOCATION
// ===============================
function showCurrentLocation() {
    map.locate({ setView: true, maxZoom: 6 });

    map.on('locationfound', function(e) {
        const lat = e.latitude || e.latlng.lat;
        const lng = e.longitude || e.latlng.lng;

        const locationIcon = L.icon({ iconUrl: 'images/location.png', iconSize: [40, 40] });
        L.marker([lat, lng], { icon: locationIcon }).addTo(map)
         .bindPopup("You are here").openPopup();

        $.getJSON(`php/reverseGeocode.php?lat=${lat}&lng=${lng}`, function(data){
            if(data.iso_a2) $("#countrySelect").val(data.iso_a2).trigger('change');
        });
    });

    map.on('locationerror', function(){
        alert("Unable to retrieve your location.");
    });
}
showCurrentLocation();

// ===============================
// EASY BUTTONS
// ===============================
L.easyButton('<i class="fa fa-info"></i>', () => $('#infoModal').modal('show')).addTo(map);
L.easyButton('<i class="fa fa-crosshairs"></i>', () => map.locate({ setView: true })).addTo(map);

// ===============================
// CURRENCY CONVERTER
// ===============================
$('#showCalculatorBtn').on('click', function(){
    if(!currentCountryInfo || !currentCountryInfo.exchangeRate){
        alert("Please select a country with a valid currency.");
        return;
    }
    $('#amountInput').val('');
    $('#convertedResult').text('');
    $('#calculatorModal').modal('show');
});

$(document).on('click', '#calculateBtn', function(){
    const amount = parseFloat($('#amountInput').val());
    if(isNaN(amount) || amount <= 0){ alert("Enter a valid amount"); return; }

    const rate = currentCountryInfo.exchangeRate;
    const currency = currentCountryInfo.currency || "N/A";
    const result = (amount * rate).toFixed(2);
    $('#convertedResult').text(`${amount} ${currency} = ${result} USD`);
});

// ===============================
// NEWS BUTTON
// ===============================
$('#showNewsBtn').on('click', function(){
    const code = $('#countrySelect').val();
    if(code) loadLocalNews(code);
    else alert("Please select a country first.");
});

// ===============================
// WEATHER FUNCTIONS
// ===============================
function mapWeatherToIcon(desc){
    desc = desc.toLowerCase();
    if(desc.includes("sun") || desc.includes("clear")) return "fa-solid fa-sun";
    if(desc.includes("cloud")) return "fa-solid fa-cloud";
    if(desc.includes("rain") || desc.includes("drizzle")) return "fa-solid fa-cloud-showers-heavy";
    if(desc.includes("snow")) return "fa-solid fa-snowflake";
    if(desc.includes("thunder")) return "fa-solid fa-bolt";
    return "fa-solid fa-cloud-sun";
}

function mapWeatherToColor(desc){
    desc = desc.toLowerCase();
    if(desc.includes("sun") || desc.includes("clear")) return "#f39c12";
    if(desc.includes("cloud")) return "#95a5a6";
    if(desc.includes("rain") || desc.includes("drizzle")) return "#3498db";
    if(desc.includes("snow")) return "#a3e4f9";
    if(desc.includes("thunder")) return "#f1c40f";
    return "#f39c12";
}

function showWeatherModal(weatherData){
    // Current weather
    document.getElementById("weatherIcon").src = weatherData.current.icon;
    document.getElementById("currentTemp").textContent = `${weatherData.current.temp}°C`;
    document.getElementById("currentDesc").textContent = weatherData.current.desc;

    // Forecast
    const forecastContainer = document.getElementById("forecastContainer");
    forecastContainer.innerHTML = "";
    weatherData.forecast.forEach(day => {
        const card = document.createElement("div");
        card.className = "card text-center p-2 me-2 mb-2";
        card.innerHTML = `
            <p class="mb-1 fw-bold">${day.day}</p>
            <i class="${day.iconClass}" style="font-size:24px; color:${day.iconColor};"></i>
            <p class="mb-0">${day.temp}°C</p>
            <small>${day.desc}</small>
        `;
        forecastContainer.appendChild(card);
    });
    new bootstrap.Modal(document.getElementById('weatherModal')).show();
}

function fetchWeather(city){
    if(!city) return;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;

    fetch(weatherUrl).then(res=>res.json()).then(currentData=>{
        fetch(forecastUrl).then(res=>res.json()).then(forecastData=>{
            const forecastList = forecastData.list.filter(i=>i.dt_txt.includes("12:00:00")).slice(0,5);
            const weatherData = {
                current: {
                    temp: Math.round(currentData.main.temp),
                    desc: currentData.weather[0].description,
                    icon: `http://openweathermap.org/img/wn/${currentData.weather[0].icon}.png`
                },
                forecast: forecastList.map(f=>({
                    day: new Date(f.dt_txt).toLocaleDateString('en-US',{weekday:'short'}),
                    temp: Math.round(f.main.temp),
                    desc: f.weather[0].main,
                    iconClass: mapWeatherToIcon(f.weather[0].main),
                    iconColor: mapWeatherToColor(f.weather[0].main)
                }))
            };
            showWeatherModal(weatherData);
        });
    }).catch(()=>alert("Failed to fetch weather data."));
}
