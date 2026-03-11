// --- Fix Leaflet marker icons ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: './css/images/marker-icon.png',
    iconRetinaUrl: './css/images/marker-icon-2x.png',
    shadowUrl: './css/images/marker-shadow.png'
});

// --- Initialize map ---
let map = L.map("map").setView([20, 0], 2);

// --- Base layers ---
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17 });
const satellite = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", { maxZoom: 19 });

// Add default base map
osm.addTo(map);

// --- Overlay layers ---
let cityLayer = L.markerClusterGroup();
let weatherLayer = L.layerGroup();
let countryBorderLayer = null;
let currentCountryInfo = null;
let homeCountry = null;

cityLayer.addTo(map);
weatherLayer.addTo(map);

// --- Layer control ---
const baseMaps = {
    "OpenStreetMap": osm,
    "Topo Map": topo,
    "Satellite": satellite
};
const overlayMaps = {
    "Cities": cityLayer,
    "Weather": weatherLayer
};
L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

/* =========================
   LOAD COUNTRIES AND BIND DROPDOWN
   ========================= */
$(document).ready(function () {
    $.getJSON("php/getCountries.php")
        .done(function (response) {
            if (!response || !response.data) {
                alert("Unable to load countries.");
                return;
            }

            response.data.forEach(country => {
                if (country.iso_a2) {
                    $("#countrySelect").append(`<option value="${country.iso_a2}">${country.name}</option>`);
                }
            });

            $("#countrySelect").on("change", function () {
                const code = $(this).val();
                if (!code) return;
                loadCountryBorder(code);
                loadCountryInfo(code);
            });

            detectUserCountry();
        })
        .fail(function () {
            alert("Unable to load countries.");
        });
});

/* =========================
   COUNTRY BORDER
   ========================= */
function loadCountryBorder(code) {
    cityLayer.clearLayers();
    weatherLayer.clearLayers();

    $.getJSON("php/getCountryBorders.php", { code }, function (json) {
        if (countryBorderLayer) map.removeLayer(countryBorderLayer);
        if (json) {
            countryBorderLayer = L.geoJSON(json, { color: "yellow", weight: 2 }).addTo(map);
            map.fitBounds(countryBorderLayer.getBounds());
        }
    }).fail(function () {
        alert("Unable to load country border.");
    });
}

/* =========================
   COUNTRY INFO
   ========================= */
function loadCountryInfo(code) {
    $.getJSON("php/getCountryData.php", { iso: code }, function (info) {
        currentCountryInfo = { ...info, iso: code };

        $("#capital").text(info.capital || "N/A");
        $("#population").text(info.population ? numeral(info.population).format('0,0') : "N/A");
        $("#currency").text(info.currency || "N/A");
        $("#wikiLink").attr("href", info.wiki || "#");

        populateCurrency(info.currency);
        loadCountryMarkers();

        if (info.currency) fetchExchangeRate(info.currency, "USD");

        if (info.capital && info.capitalInfo && info.capitalInfo.latlng) {
            const [lat, lng] = info.capitalInfo.latlng;
            fetchWeather(lat, lng);
        }
    }).fail(function () {
        alert("Failed to load country information");
    });
}

/* =========================
   EXCHANGE RATE
   ========================= */
function fetchExchangeRate(from, to) {
    $.getJSON("php/fetchExchangeRates.php", { from, to })
        .done(function (data) {
            $("#exchangeRate").text(data.rate ? `1 ${from} = ${data.rate.toFixed(2)} ${to}` : "Exchange rate unavailable.");
        })
        .fail(function () {
            $("#exchangeRate").text("Exchange rate unavailable.");
        });
}

/* =========================
   CITY MARKERS
   ========================= */
function loadCountryMarkers() {
    cityLayer.clearLayers();
    if (!currentCountryInfo || !currentCountryInfo.cities) return;

    currentCountryInfo.cities.slice(0, 500).forEach(city => {
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            L.marker([lat, lng]).bindPopup(`${city.name}`).addTo(cityLayer);
        }
    });
}

/* =========================
   WEATHER
   ========================= */
function fetchWeather(lat, lng) {
    $.getJSON("php/fetchWeather.php", { lat, lng }, function (data) {
        if (data.error) { alert(data.error); return; }

        weatherLayer.clearLayers();

        L.marker([lat, lng]).bindPopup(`
            <b>Current Weather</b><br>
            Temperature: ${data.current.temp} °C<br>
            Condition: ${data.current.desc}
        `).addTo(weatherLayer);

        $("#weatherIcon").attr("src", data.current.icon);
        $("#currentTemp").text(data.current.temp + " °C");
        $("#currentDesc").text(data.current.desc);

        $("#forecastContainer").empty();
        if (data.forecast) {
            data.forecast.forEach(day => {
                const card = `
                <div class="card p-2 text-center" style="width:90px">
                    <p>${day.day}</p>
                    <img src="${day.icon}" style="width:40px">
                    <p>${day.temp}°C</p>
                </div>`;
                $("#forecastContainer").append(card);
            });
        }

        $("#weatherModal").modal("show");
    }).fail(function () {
        alert("Failed to fetch weather data");
    });
}

/* =========================
   CURRENCY
   ========================= */
function populateCurrency(currency) {
    $("#fromCurrency").empty();
    $("#toCurrency").empty();

    $("#fromCurrency").append(`<option>${currency}</option>`);
    const commonCurrencies = [currency, "USD", "EUR", "GBP", "JPY", "AUD"];
    [...new Set(commonCurrencies)].forEach(cur => $("#toCurrency").append(`<option>${cur}</option>`));
}

$("#calculateBtn").on("click", function () {
    if (!currentCountryInfo) return;

    const amount = parseFloat($("#amountInput").val());
    if (isNaN(amount) || amount <= 0) {
        $("#convertedResult").text("Enter a valid amount.");
        return;
    }

    const from = $("#fromCurrency").val().trim();
    const to = $("#toCurrency").val().trim();

    $.getJSON("php/fetchExchangeRates.php", { from, to }, function (data) {
        if (data.error) {
            $("#convertedResult").text(data.error);
            return;
        }
        const result = amount * data.rate;
        $("#convertedResult").text(`${amount} ${from} = ${result.toFixed(2)} ${to}`);
    }).fail(function () {
        $("#convertedResult").text("Exchange rate unavailable.");
    });
});

/* =========================
   PUBLIC HOLIDAYS
   ========================= */
function fetchPublicHolidays(code) {
    $("#holidaysModalBody").html("<p>Loading holidays...</p>");
    $.getJSON(`php/getPublicHolidays.php?country=${code}`, function (data) {
        const container = $("#holidaysModalBody").empty();
        if (!data || !data.length) {
            container.append("<p>No public holidays available.</p>");
            return;
        }

        const list = $("<ul class='list-group'></ul>");
        data.forEach(holiday => {
            const formattedDate = Date.parse(holiday.date).toString("dddd d MMMM yyyy");
            list.append(`<li class='list-group-item'>${formattedDate} - ${holiday.localName}</li>`);
        });
        container.append(list);
        $("#holidaysModal").modal("show");
    }).fail(() => {
        $("#holidaysModalBody").html("<p>Failed to load public holidays.</p>");
        $("#holidaysModal").modal("show");
    });
}

/* =========================
   NEWS
   ========================= */
function loadLocalNews(code) {
    $("#newsModalBody").html("<p>Loading news...</p>");
    $.getJSON("php/getLocalNews.php", { country: code }, function (data) {
        const container = $("#newsModalBody").empty();
        if (!data || !data.articles || !data.articles.length) {
            container.append("<p>No news available.</p>");
            return;
        }

        data.articles.slice(0, 5).forEach(article => {
            container.append(`
            <div class="mb-3">
                <a href="${article.url}" target="_blank">
                    <strong>${article.title}</strong>
                </a>
                <p>${article.description || ""}</p>
            </div>`);
        });
        $("#newsModal").modal("show");
    }).fail(() => {
        $("#newsModalBody").html("<p>Failed to load news.</p>");
        $("#newsModal").modal("show");
    });
}

/* =========================
   EASY BUTTONS
   ========================= */
L.easyButton('<i class="fa-solid fa-circle-info"></i>', () => $("#infoModal").modal("show")).addTo(map);
L.easyButton('<i class="fa-solid fa-house"></i>', function () {
    if (homeCountry) $("#countrySelect").val(homeCountry).change();
}).addTo(map);
L.easyButton('<i class="fa-solid fa-cloud"></i>', function () {
    if (!currentCountryInfo) return alert("Select a country first");
    if (currentCountryInfo.capitalInfo && currentCountryInfo.capitalInfo.latlng) {
        const [lat, lng] = currentCountryInfo.capitalInfo.latlng;
        fetchWeather(lat, lng);
    }
}).addTo(map);
L.easyButton('<i class="fa-solid fa-newspaper"></i>', function () {
    const code = $("#countrySelect").val();
    if (code) loadLocalNews(code);
}).addTo(map);
L.easyButton('<i class="fa-solid fa-coins"></i>', () => $("#calculatorModal").modal("show")).addTo(map);
L.easyButton('<i class="fa-solid fa-calendar-days"></i>', function () {
    if (!currentCountryInfo) return alert("Select a country first");
    fetchPublicHolidays(currentCountryInfo.iso);
}).addTo(map);

/* =========================
   USER LOCATION (silent)
   ========================= */
function detectUserCountry() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true,
            timeout: 10000
        });
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    $.ajax({
        url: "php/getCountryFromCoords.php",
        type: "POST",
        dataType: "json",
        data: { lat, lng },
        success: function (result) {
            if (result.status.name === "ok") {
                homeCountry = result.data.countryCode;
                $("#countrySelect").val(homeCountry).change();
            }
        }
    });
}

function showError(error) {
    // silently handle errors
}

/* =========================
   PRELOADER
   ========================= */
$(window).on("load", function () {
    $("#preloader").fadeOut(500);
});


function calcResult() {
    const fromAmount = parseFloat($('#fromAmount').val()) || 0;
    const rate = parseFloat($('#exchangeRate').val()) || 0;
    const result = fromAmount * rate;
    $('#toAmount').val(numeral(result).format("0,0.00"));
}

// Trigger calculation on input or changes
$('#fromAmount').on('keyup change', calcResult);
$('#exchangeRate').on('change', calcResult);

// Calculate when modal opens
$('#exampleModal').on('show.bs.modal', calcResult);

// Reset input when modal closes
$('#exampleModal').on('hidden.bs.modal', function () {
    $('#fromAmount').val(1);
});