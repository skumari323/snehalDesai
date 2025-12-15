// ===============================
// GLOBAL VARIABLES
// ===============================
let map = L.map("map").setView([20, 0], 2);
let cityLayer = L.markerClusterGroup();
let weatherLayer = L.layerGroup();
let countryBorderLayer = null;
let currentCountryInfo = null;
const API_KEY = "bc0563fee69bbaa438597448d47360fc";

// ===============================
// INITIAL MAP SETUP
// ===============================
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
}).addTo(map);

cityLayer.addTo(map);

const overlayMaps = {
    "Cities": cityLayer,
    "Weather": weatherLayer
};

L.control.layers(null, overlayMaps, { collapsed: true }).addTo(map);

// ===============================
// LOAD COUNTRY LIST
// ===============================
$(document).ready(function () {
    $.getJSON("php/getCountries.php", function (countries) {
        countries.forEach(country => {
            if (country.iso_a2) {
                $("#countrySelect").append(
                    `<option value="${country.iso_a2}">${country.name}</option>`
                );
            }
        });
    });
});

// ===============================
// COUNTRY SELECTION
// ===============================
$("#countrySelect").on("change", function () {
    const code = $(this).val();
    if (!code) return;

    loadCountryBorder(code);
    loadCountryInfo(code);
    loadCountryMarkers(code);
});

// ===============================
// COUNTRY BORDER
// ===============================
function loadCountryBorder(code) {
    $.getJSON("php/getCountryBorders.php", { code }, function (json) {
        if (countryBorderLayer) map.removeLayer(countryBorderLayer);

        countryBorderLayer = L.geoJSON(json, {
            color: "yellow",
            weight: 2
        }).addTo(map);

        map.fitBounds(countryBorderLayer.getBounds());
    });
}

// ===============================
// COUNTRY INFO
// ===============================
function loadCountryInfo(code) {
    $.getJSON("php/fetchData.php", { iso: code }, function (info) {
        currentCountryInfo = info;

        $("#capital").text(info.capital || "N/A");
        $("#population").text(info.population?.toLocaleString() || "N/A");
        $("#currency").text(info.currency || "N/A");
        $("#exchangeRate").text(info.exchangeRate ? info.exchangeRate.toFixed(4) + " USD" : "N/A");
        $("#wikiLink").attr("href", info.wiki || "#");

        if (info.capital) fetchWeather(info.capital);
    });
}

// ===============================
// CITY MARKERS
// ===============================
function loadCountryMarkers(code) {
    $.getJSON(
        `http://api.geonames.org/searchJSON?country=${code}&maxRows=50&username=skumari`,
        function (data) {
            cityLayer.clearLayers();

            if (data.geonames) {
                data.geonames.forEach(place => {
                    const lat = parseFloat(place.lat);
                    const lng = parseFloat(place.lng);

                    if (!isNaN(lat) && !isNaN(lng)) {
                        L.marker([lat, lng])
                            .bindPopup(place.name)
                            .addTo(cityLayer);
                    }
                });
            }
        }
    );
}

// ===============================
// EASY BUTTONS
// ===============================
L.easyButton("fa-info", () => $("#infoModal").modal("show")).addTo(map);
L.easyButton("fa-crosshairs", () => map.locate({ setView: true })).addTo(map);
L.easyButton("fa-cloud", () => {
    if (!currentCountryInfo || !currentCountryInfo.capital) {
        alert("Please select a country first.");
        return;
    }
    fetchWeather(currentCountryInfo.capital);
}).addTo(map);
L.easyButton("fa-newspaper", () => {
    const code = $("#countrySelect").val();
    if (code) loadLocalNews(code);
}).addTo(map);
L.easyButton("fa-coins", () => {
    if (!currentCountryInfo) return alert("Select a country first");
    $("#calculatorModal").modal("show");
}).addTo(map);

// ===============================
// LOCAL NEWS
// ===============================
function loadLocalNews(code) {
    $.getJSON(`php/getLocalnews.php?country=${code}`, function (data) {
        $("#newsModalBody").empty();

        if (!data || !data.results || data.results.length === 0) {
            $("#newsModalBody").append(`<p>No news available</p>`);
        } else {
            data.results.forEach(article => {
                $("#newsModalBody").append(
                    `<div class="news-item mb-2"><a href="${article.link}" target="_blank">${article.title}</a></div>`
                );
            });
        }

        $("#newsModal").modal("show");
    }).fail(function () {
        $("#newsModalBody").empty().append(`<p>Failed to load news.</p>`);
        $("#newsModal").modal("show");
    });
}

// ===============================
// WEATHER FUNCTIONS
// ===============================
function mapWeatherToIcon(desc) {
    desc = desc.toLowerCase();
    if (desc.includes("sun") || desc.includes("clear")) return "fa-solid fa-sun";
    if (desc.includes("cloud")) return "fa-solid fa-cloud";
    if (desc.includes("rain") || desc.includes("drizzle")) return "fa-solid fa-cloud-showers-heavy";
    if (desc.includes("snow")) return "fa-solid fa-snowflake";
    if (desc.includes("thunder")) return "fa-solid fa-bolt";
    return "fa-solid fa-cloud-sun";
}

function mapWeatherToColor(desc) {
    desc = desc.toLowerCase();
    if (desc.includes("sun") || desc.includes("clear")) return "#f39c12";
    if (desc.includes("cloud")) return "#95a5a6";
    if (desc.includes("rain") || desc.includes("drizzle")) return "#3498db";
    if (desc.includes("snow")) return "#a3e4f9";
    if (desc.includes("thunder")) return "#f1c40f";
    return "#f39c12";
}

function showWeatherModal(weatherData) {
    $("#weatherIcon").attr("src", weatherData.current.icon.replace("http://", "https://"));
    $("#currentTemp").text(`${weatherData.current.temp}°C`);
    $("#currentDesc").text(weatherData.current.desc);

    const container = $("#forecastContainer");
    container.empty();

    weatherData.forecast.forEach(day => {
        container.append(`
            <div class="card text-center p-2 me-2 mb-2">
                <p class="mb-1 fw-bold">${day.day}</p>
                <i class="${day.iconClass}" style="font-size:24px;color:${day.iconColor};"></i>
                <p class="mb-0">${day.temp}°C</p>
                <small>${day.desc}</small>
            </div>
        `);
    });

    new bootstrap.Modal(document.getElementById("weatherModal")).show();
}

function fetchWeather(city) {
    if (!city) return;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;

    fetch(weatherUrl)
        .then(r => r.json())
        .then(current => {
            fetch(forecastUrl)
                .then(r => r.json())
                .then(forecast => {
                    const forecastList = forecast.list
                        .filter(i => i.dt_txt.includes("12:00:00"))
                        .slice(0, 5);

                    const weatherData = {
                        current: {
                            temp: Math.round(current.main.temp),
                            desc: current.weather[0].description,
                            icon: `https://openweathermap.org/img/wn/${current.weather[0].icon}.png`
                        },
                        forecast: forecastList.map(f => ({
                            day: new Date(f.dt_txt).toLocaleDateString("en-US", { weekday: "short" }),
                            temp: Math.round(f.main.temp),
                            desc: f.weather[0].main,
                            iconClass: mapWeatherToIcon(f.weather[0].main),
                            iconColor: mapWeatherToColor(f.weather[0].main)
                        }))
                    };

                    showWeatherModal(weatherData);
                });
        })
        .catch(() => alert("Failed to fetch weather data."));
}


// ===============================
// LOCATION EVENT HANDLERS for GPS button
// ===============================
map.on('locationfound', function(e) {
    const lat = e.latitude || e.latlng.lat;
    const lng = e.longitude || e.latlng.lng;

    L.marker([lat, lng])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

    map.setView([lat, lng], 12);
});

map.on('locationerror', function() {
    alert('Unable to retrieve your location.');
});






