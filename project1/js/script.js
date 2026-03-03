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
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

cityLayer.addTo(map);
weatherLayer.addTo(map);

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
        $("#population").text(info.population ? numeral(info.population).format("0,0") : "N/A");
        $("#currency").text(info.currency || "N/A");

        if (info.exchangeRate && info.currency) {
            $("#exchangeRate").text(
                `1 ${info.currency} = ${numeral(info.exchangeRate).format("0,0.0000")} USD`
            );
        } else {
            $("#exchangeRate").text("N/A");
        }

        $("#wikiLink").attr("href", info.wiki || "#");

        loadCountryMarkers();

        if (info.capital) fetchWeather(info.capital);
    });
}

// ===============================
// CITY MARKERS
// ===============================
function loadCountryMarkers() {
    cityLayer.clearLayers();

    if (!currentCountryInfo || !currentCountryInfo.cities) return;

    currentCountryInfo.cities.forEach(city => {
        const lat = parseFloat(city.lat);
        const lng = parseFloat(city.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            L.marker([lat, lng])
                .bindPopup(
                    `${city.name}<br>Population: ${
                        city.population ? numeral(city.population).format("0,0") : "N/A"
                    }`
                )
                .addTo(cityLayer);
        }
    });
}

// ===============================
// EASY BUTTONS
// ===============================
L.easyButton("fa-info", () => $("#infoModal").modal("show")).addTo(map);
L.easyButton("fa-crosshairs", () => map.locate({ setView: false })).addTo(map);

map.on("locationfound", function (e) {
    map.setView(e.latlng, 10);
});

L.easyButton("fa-cloud", () => {
    if (!currentCountryInfo || !currentCountryInfo.capital) {
        alert("Select a country first.");
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

L.easyButton("fa-calendar-days", () => {
    if (!currentCountryInfo) return alert("Select a country first");
    fetchPublicHolidays(currentCountryInfo.iso);
}).addTo(map);

// ===============================
// LOCAL NEWS
// ===============================
function loadLocalNews(code) {
    $.getJSON(`php/getLocalnews.php?country=${code}`, function (data) {
        const container = $("#newsModalBody").empty();

        if (!data || !data.results || !data.results.length) {
            container.append(`<p>No news available</p>`);
        } else {
            data.results.forEach(article => {
                container.append(`
                    <div class="news-item mb-2">
                        <a href="${article.link}" target="_blank">${article.title}</a>
                    </div>
                `);
            });
        }

        $("#newsModal").modal("show");
    }).fail(() => {
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

    const container = $("#forecastContainer").empty();

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
// FETCH WEATHER
// ===============================
function fetchWeather(city) {
    const API_KEY = "4711edd5e9402b5bcce9deea4cca42e6";

    const weatherUrl =
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},${currentCountryInfo.iso}&units=metric&appid=${API_KEY}`;

    fetch(weatherUrl)
        .then(res => {
            if (!res.ok) throw new Error("Weather request failed");
            return res.json();
        })
        .then(forecast => {
            if (!forecast.list || !forecast.list.length) {
                alert("No weather data available.");
                return;
            }

            const current = forecast.list[0];

            showWeatherModal({
                current: {
                    temp: Math.round(current.main.temp),
                    desc: current.weather[0].description,
                    icon: `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`
                },
                forecast: forecast.list
                    .filter(i => i.dt_txt.includes("12:00:00"))
                    .slice(0, 5)
                    .map(f => ({
                        day: new Date(f.dt_txt).toLocaleDateString("en-US", { weekday: "short" }),
                        temp: Math.round(f.main.temp),
                        desc: f.weather[0].description,
                        iconClass: mapWeatherToIcon(f.weather[0].description),
                        iconColor: mapWeatherToColor(f.weather[0].description)
                    }))
            });
        })
        .catch(err => {
            console.error("Weather error:", err);
            alert("Failed to fetch weather data.");
        });
}

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
        `${amount} ${currentCountryInfo.currency} = ${numeral(usdValue).format("0,0.00")} USD`
    );
});

$("#calculatorModal").on("shown.bs.modal", function () {
    $("#amountInput").val("");
    $("#convertedResult").text("");
});

// ===============================
// PUBLIC HOLIDAYS
// ===============================
function fetchPublicHolidays(countryCode) {
    $("#holidaysModalBody").html("<p>Loading holidays...</p>");

    $.getJSON(`php/getPublicHolidays.php?country=${countryCode}`, function (data) {
        const container = $("#holidaysModalBody").empty();

        if (!data || !data.length) {
            container.append("<p>No public holidays available.</p>");
            return;
        }

        const list = $("<ul class='list-group'></ul>");
        data.forEach(holiday => {
            list.append(
                `<li class='list-group-item'>
                    ${new Date(holiday.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })} - ${holiday.localName}
                </li>`
            );
        });

        container.append(list);
        $("#holidaysModal").modal("show");
    }).fail(() => {
        $("#holidaysModalBody").html("<p>Failed to load public holidays.</p>");
        $("#holidaysModal").modal("show");
    });
}
$('#pre-load').addClass("fadeOut")


if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        showPosition,
        showError
    );
} else {
    console.log("Geolocation is not supported by this browser.");
}

function showPosition(position) {

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    $.ajax({
        url: "php/getCountryFromCoords.php",
        type: "POST",
        dataType: "json",
        data: {
            lat: lat,
            lng: lng
        },
        success: function(result) {

            if (result.status.name === "ok") {

                const countryCode = result.data.countryCode;

                $('#countrySelect')
                    .val(countryCode)
                    .change();

            } else {
                console.log(result.status.message);
            }
        },
        error: function() {
            console.log("AJAX request failed.");
        }
    });
}

function showError(error) {
    console.log("Geolocation error: " + error.message);
}