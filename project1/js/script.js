// =======================
// GLOBAL VARIABLES
// =======================
let map;
let borderLayer = null;
let cityLayer = null;

// =======================
// INITIALIZE MAP
// =======================
function initMap() {
    map = L.map("map").setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
    }).addTo(map);

    // Reset view button
    L.easyButton("fa-globe", () => {
        map.setView([20, 0], 2);
    }).addTo(map);
}

// =======================
// LOAD COUNTRIES
// =======================
function loadCountries() {
    $.ajax({
        url: "php/getCountryBorders.php",
        method: "GET",
        success: function(data) {
            const select = $("#countrySelect");
            data.sort((a,b) => a.name.localeCompare(b.name));
            data.forEach(c => {
                select.append(`<option value="${c.iso}">${c.name}</option>`);
            });
        }
    });
}

// =======================
// LOAD COUNTRY BORDER & INFO
// =======================
function loadBorder(countryCode) {
    $.ajax({
        url: "php/fetchData.php",
        method: "POST",
        data: { iso: countryCode },
        success: function(data) {
            if (data.error) return console.error(data.error);

            if (borderLayer) map.removeLayer(borderLayer);
            borderLayer = L.geoJSON(JSON.parse(data.border), { color: "green", weight: 2 }).addTo(map);
            map.fitBounds(borderLayer.getBounds(), { padding: [20,20] });

            loadCities(countryCode);

            // Populate info
            $("#capital").text(data.capital);
            $("#population").text(Number(data.population).toLocaleString());
            $("#currency").text(data.currency);

            loadExchangeRate(data.currency);
            loadWeather(data.capital, countryCode);
            loadWiki(data.name);
        }
    });
}

// =======================
// LOAD CITIES FROM GEONAMES
// =======================
function loadCities(countryCode) {
    if (cityLayer) map.removeLayer(cityLayer);
    cityLayer = L.markerClusterGroup();

    const geonamesURL = `https://secure.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=50&orderby=population&username=skumari`;

    $.ajax({
        url: geonamesURL,
        method: "GET",
        success: function(data) {
            if (!data.geonames) return;
            data.geonames.forEach(city => {
                const marker = L.marker([city.lat, city.lng]).bindPopup(`
                    <strong>${city.name}</strong><br>
                    Population: ${Number(city.population).toLocaleString()}
                `);
                cityLayer.addLayer(marker);
            });
            map.addLayer(cityLayer);
        }
    });
}

// =======================
// LOAD EXCHANGE RATE
// =======================
function loadExchangeRate(currencyCode) {
    if (!currencyCode) { $("#exchangeRate").text("N/A"); return; }
    $.ajax({
        url: "php/fetchExchangeRates.php",
        method: "POST",
        data: { currency: currencyCode },
        success: function(data) {
            if (data.error) { $("#exchangeRate").text("N/A"); return; }
            $("#exchangeRate").text(data.rateUSD.toFixed(2));
        },
        error: function() { $("#exchangeRate").text("N/A"); }
    });
}

// =======================
// LOAD WEATHER
// =======================
function loadWeather(city, countryCode) {
    if (!city) { $("#weather").text("Weather unavailable"); return; }

    $.ajax({
        url: "php/fetchWeather.php",
        method: "POST",
        data: { city: city, iso: countryCode },
        success: function(data) {
            if (data.error) { $("#weather").text("Weather unavailable"); return; }
            $("#weather").text(`${data.description}, ${data.temp}°C`);
        },
        error: function() { $("#weather").text("Weather unavailable"); }
    });
}

// =======================
// LOAD WIKIPEDIA
// =======================
function loadWiki(countryName) {
    if (!countryName) return;
    $.ajax({
        url: "php/fetchWiki.php",
        method: "POST",
        data: { country: countryName },
        success: function(data) {
            if (data.error) return;
            $("#wikiLink").attr("href", data.url);
        }
    });
}

// =======================
// SIDEBAR TOGGLE
// =======================
function initSidebarToggle() {
    $("#sidebarToggle").click(() => {
        $("#sidebar").toggleClass("collapsed");
        $("#map").toggleClass("expanded");
        setTimeout(() => map.invalidateSize(), 310);
    });
}

// =======================
// ON PAGE LOAD
// =======================
$(document).ready(() => {
    initMap();
    loadCountries();
    initSidebarToggle();

    $("#countrySelect").change(function() {
        const iso = $(this).val();
        if (iso) loadBorder(iso);
    });
});

















