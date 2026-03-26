/* =========================
   LEAFLET ICON FIX
   ========================= */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: './css/images/marker-icon.png',
    iconRetinaUrl: './css/images/marker-icon-2x.png',
    shadowUrl: './css/images/marker-shadow.png'
});

/* =========================
   MAP INITIALISATION
   ========================= */
const map = L.map("map").setView([20, 0], 2);

/* =========================
   BASE MAPS
   ========================= */
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17 });
const humanitarian = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", { maxZoom: 19 });

osm.addTo(map);

/* =========================
   LAYERS
   ========================= */
const cityLayer = L.markerClusterGroup();
const weatherLayer = L.layerGroup();
let countryBorderLayer = null;

let currentCountryInfo = null;
let homeCountry = null;
let firstLoad = true;

cityLayer.addTo(map);
weatherLayer.addTo(map);

/* =========================
   LAYER CONTROL
   ========================= */
L.control.layers(
    {
        "OpenStreetMap": osm,
        "Topo Map": topo,
        "Humanitarian": humanitarian
    },
    {
        "Cities": cityLayer,
        "Weather": weatherLayer
    },
    { collapsed: false }
).addTo(map);

/* =========================
   PRELOADER CONTROL
   ========================= */
function hidePreloaderOnce() {
    if (firstLoad) {
        $("#preloader").fadeOut(500);
        firstLoad = false;
    }
}

// 🔒 Safety fallback (prevents map lock)
$(window).on("load", function () {
    setTimeout(() => {
        $("#preloader").fadeOut(500);
    }, 3000);
});

/* =========================
   LOAD COUNTRIES
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
                    $("#countrySelect").append(
                        `<option value="${country.iso_a2}">${country.name}</option>`
                    );
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
            countryBorderLayer = L.geoJSON(json, {
                color: "yellow",
                weight: 2
            }).addTo(map);

            map.fitBounds(countryBorderLayer.getBounds());

            // ✅ Correct preloader hide
            hidePreloaderOnce();
        }

    }).fail(function () {
        alert("Unable to load country border.");
        hidePreloaderOnce(); // 🔒 ensure it still hides on failure
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

        if (info.capitalInfo && info.capitalInfo.latlng) {
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

            $("#exchangeRate").text(
                data.rate
                    ? `1 ${from} = ${numeral(data.rate).format('0,0.00')} ${to}`
                    : "Exchange rate unavailable."
            );

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
            L.marker([lat, lng])
                .bindPopup(city.name)
                .addTo(cityLayer);
        }
    });
}

/* =========================
   WEATHER
   ========================= */
function fetchWeather(lat, lng) {

    $.getJSON("php/fetchWeather.php", { lat, lng }, function (data) {

        if (data.error) {
            alert(data.error);
            return;
        }

        weatherLayer.clearLayers();

        L.marker([lat, lng])
            .bindPopup(`
                <b>Current Weather</b><br>
                Temperature: ${data.current.temp} °C<br>
                Condition: ${data.current.desc}
            `)
            .addTo(weatherLayer);

        $("#weatherIcon").attr("src", data.current.icon);
        $("#currentTemp").text(`${data.current.temp} °C`);
        $("#currentDesc").text(data.current.desc);

        $("#forecastContainer").empty();

        if (data.forecast) {
            data.forecast.forEach(day => {
                $("#forecastContainer").append(`
                    <div class="card p-2 text-center" style="width:90px">
                        <p>${day.day}</p>
                        <img src="${day.icon}" style="width:40px">
                        <p>${day.temp}°C</p>
                    </div>
                `);
            });
        }

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

    const list = [currency, "USD", "EUR", "GBP", "JPY", "AUD"];

    [...new Set(list)].forEach(cur => {
        $("#toCurrency").append(`<option>${cur}</option>`);
    });
}

$("#calculateBtn").on("click", function () {

    if (!currentCountryInfo) return;

    const amount = parseFloat($("#amountInput").val());

    if (isNaN(amount) || amount <= 0) {
        $("#convertedResult").text("Enter a valid amount.");
        return;
    }

    const from = $("#fromCurrency").val();
    const to = $("#toCurrency").val();

    $.getJSON("php/fetchExchangeRates.php", { from, to }, function (data) {

        if (data.error) {
            $("#convertedResult").text(data.error);
            return;
        }

        const result = amount * data.rate;

        $("#convertedResult").text(
            `${numeral(amount).format('0,0.00')} ${from} = ${numeral(result).format('0,0.00')} ${to}`
        );

    }).fail(function () {
        $("#convertedResult").text("Exchange rate unavailable.");
    });
});

/* =========================
   HOLIDAYS
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
            const date = Date.parse(holiday.date).toString("dddd d MMMM yyyy");
            list.append(`<li class='list-group-item'>${date} - ${holiday.localName}</li>`);
        });

        container.append(list);
        $("#holidaysModal").modal("show");

    }).fail(function () {
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
                    ${article.image_url ? `<img src="${article.image_url}" class="img-fluid mb-2">` : ""}
                    <a href="${article.url}" target="_blank">
                        <strong>${article.title}</strong>
                    </a>
                    <p>${article.description || ""}</p>
                </div>
            `);
        });

        $("#newsModal").modal("show");

    }).fail(function () {
        $("#newsModalBody").html("<p>Failed to load news.</p>");
        $("#newsModal").modal("show");
    });
}

/* =========================
   BUTTONS
   ========================= */
L.easyButton('<i class="fa-solid fa-circle-info"></i>', () => $("#infoModal").modal("show")).addTo(map);
L.easyButton('<i class="fa-solid fa-house"></i>', () => homeCountry && $("#countrySelect").val(homeCountry).change()).addTo(map);
L.easyButton('<i class="fa-solid fa-cloud"></i>', () => {

    if (!currentCountryInfo) {
        alert("Select a country first");
        return;
    }

    let coords = currentCountryInfo.capitalInfo?.latlng;

    // 🔥 fallback if capital coords missing
    if (!coords && countryBorderLayer) {
        const center = countryBorderLayer.getBounds().getCenter();
        coords = [center.lat, center.lng];
    }

    if (coords) {
        fetchWeather(coords[0], coords[1]);
    } else {
        alert("Weather data unavailable for this country");
    }

}).addTo(map);
L.easyButton('<i class="fa-solid fa-newspaper"></i>', () => {
    const code = $("#countrySelect").val();
    if (code) loadLocalNews(code);
}).addTo(map);
L.easyButton('<i class="fa-solid fa-coins"></i>', () => $("#calculatorModal").modal("show")).addTo(map);
L.easyButton('<i class="fa-solid fa-calendar-days"></i>', () => {
    if (!currentCountryInfo) return alert("Select a country first");
    fetchPublicHolidays(currentCountryInfo.iso);
}).addTo(map);

/* =========================
   GEOLOCATION
   ========================= */
function detectUserCountry() {

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(function (position) {

        $.ajax({
            url: "php/getCountryFromCoords.php",
            type: "POST",
            dataType: "json",
            data: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            success: function (result) {
                if (result.status.name === "ok") {
                    homeCountry = result.data.countryCode;
                    $("#countrySelect").val(homeCountry).change();
                }
            }
        });

    });
}