// ===============================
// GLOBAL VARIABLES
// ===============================
let map = L.map("map").setView([20, 0], 2);
let cityLayer = L.markerClusterGroup();
let weatherLayer = L.layerGroup();
let countryBorderLayer = null;
let currentCountryInfo = null;

// ===============================
// INITIAL MAP SETUP
// ===============================
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
}).addTo(map);

// Add layers to map
cityLayer.addTo(map);
weatherLayer.addTo(map);

// Layer control
const overlayMaps = {
    "Cities": cityLayer,
    "Weather": weatherLayer
};
L.control.layers(null, overlayMaps, {
    collapsed: false,
    position: "topright"
}).addTo(map);

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
// COUNTRY INFO + CITY MARKERS
// ===============================
function loadCountryInfo(code) {
    $.getJSON("php/fetchData.php", { iso: code }, function (info) {
        currentCountryInfo = info;

        $("#capital").text(info.capital || "N/A");
        $("#population").text(info.population?.toLocaleString() || "N/A");
        $("#currency").text(info.currency || "N/A");

        if (info.exchangeRate && info.currency) {
            $("#exchangeRate").text(
                `1 ${info.currency} = ${info.exchangeRate.toFixed(4)} USD`
            );
        } else {
            $("#exchangeRate").text("N/A");
        }

        $("#wikiLink").attr("href", info.wiki || "#");

        // Load cities as markers
        loadCountryMarkers();

        // Fetch weather for capital
        if (info.capital) {
            fetchWeather(info.capital);
        }
    });
}

// ===============================
// CITY MARKERS
// ===============================
function loadCountryMarkers() {
    cityLayer.clearLayers(); // clear old markers

    if (!currentCountryInfo || !currentCountryInfo.cities) return;

    currentCountryInfo.cities.forEach(city => {
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            L.marker([lat, lng])
                .bindPopup(`${city.name}<br>Population: ${city.population?.toLocaleString() || "N/A"}`)
                .addTo(cityLayer);
        }
    });
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
    if (!currentCountryInfo) {
        alert("Select a country first");
        return;
    }
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
                    `<div class="news-item mb-2">
                        <a href="${article.link}" target="_blank">${article.title}</a>
                    </div>`
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
// WEATHER HELPERS
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

// ===============================
// WEATHER MODAL
// ===============================
function showWeatherModal(weatherData) {
    $("#weatherIcon").attr("src", weatherData.current.icon);
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

// ===============================
// FETCH WEATHER (optimized single call)
// ===============================
function fetchWeather(city) {
    const API_KEY = "bc0563fee69bbaa438597448d47360fc"; // replace with your key
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;

    fetch(weatherUrl)
        .then(r => r.json())
        .then(forecast => {
            if (!forecast.list || forecast.list.length === 0) {
                alert("No weather data available.");
                return;
            }

            // Clear previous markers
            weatherLayer.clearLayers();

            // Add marker for the capital (current weather)
            const current = forecast.list[0];
            if (current?.main?.temp && current?.weather?.[0]) {
                L.marker([current.coord?.lat || 0, current.coord?.lon || 0])
                    .bindPopup(`<strong>${city}</strong><br>${current.weather[0].description}<br>${Math.round(current.main.temp)}°C`)
                    .addTo(weatherLayer);
            }

            // Take 5 forecasts at 12:00 for next days
            const forecastList = forecast.list
                .filter(i => i.dt_txt.includes("12:00:00"))
                .slice(0, 5);

            showWeatherModal({
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
            });
        })
        .catch(() => alert("Failed to fetch weather data."));
}

// ===============================
// GPS LOCATION HANDLERS
// ===============================
map.on("locationfound", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    L.marker([lat, lng])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

    map.setView([lat, lng], 12);
});

map.on("locationerror", function () {
    alert("Unable to retrieve your location.");
});

// ===============================
// CURRENCY CONVERTER
// ===============================
$("#calculateBtn").on("click", function () {
    if (!currentCountryInfo || !currentCountryInfo.exchangeRate) {
        $("#convertedResult").text("Please select a country first.");
        return;
    }

    const amount = parseFloat($("#amountInput").val());
    if (isNaN(amount) || amount <= 0) {
        $("#convertedResult").text("Enter a valid amount.");
        return;
    }

    const usdValue = amount * currentCountryInfo.exchangeRate;
    $("#convertedResult").text(
        `${amount} ${currentCountryInfo.currency} = ${usdValue.toFixed(2)} USD`
    );
});

// Clear fields when modal opens
$("#calculatorModal").on("shown.bs.modal", function () {
    $("#amountInput").val("");
    $("#convertedResult").text("");
});

