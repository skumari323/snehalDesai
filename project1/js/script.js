// Initialize map
const map = L.map('map').setView([20, 0], 2);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let countryLayer;
const cityMarkers = L.layerGroup().addTo(map);

const selectBox = document.getElementById('countrySelect');

// Fetch country list from borders file
fetch('data/countryBorders.geo.json')
    .then(res => res.json())
    .then(data => {
        data.features.forEach(feature => {
            const option = document.createElement('option');
            option.value = feature.id; // ISO code
            option.textContent = feature.properties.name;
            selectBox.appendChild(option);
        });
    });

// Function to add cities for a country
function addCities(countryCode) {
    cityMarkers.clearLayers();

    fetch(`php/fetchCities.php?country=${countryCode}`)
        .then(res => res.json())
        .then(data => {
            console.log(data); // Check the city data
            if (data.geonames) {
                data.geonames.forEach(city => {
                    L.marker([city.lat, city.lng])
                     .addTo(cityMarkers)
                     .bindPopup(`<b>${city.name}</b><br>Population: ${city.population}`);
                });
            }
        })
        .catch(err => console.error("Error fetching cities:", err));
}


selectBox.addEventListener("change", () => {
    const isoCode = selectBox.value;
    if (!isoCode) return;

    fetch("php/getCountryBorders.php")
        .then(res => res.json())
        .then(data => {
            const country = data.features.find(f => f.id === isoCode);
            if (!country) return;

            if (countryLayer) map.removeLayer(countryLayer);

            countryLayer = L.geoJSON(country, {
                style: { color: 'blue', weight: 2, fillOpacity: 0.1 },
                onEachFeature: function(feature, layer) {
                    fetch(`php/getCountryData.php?iso=${feature.id}`)
                        .then(res => res.json())
                        .then(info => {
                            layer.bindPopup(`
                                <b>${feature.properties.name}</b><br>
                                Capital: ${info.capital || 'N/A'}<br>
                                Population: ${info.population || 'N/A'}<br>
                                Currency: ${info.currency || 'N/A'}
                            `);
                        });
                }
            }).addTo(map);

            map.fitBounds(countryLayer.getBounds());

            // Add cities for this country
            addCities(isoCode);
        });
});

// Optional: detect user location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        map.setView([position.coords.latitude, position.coords.longitude], 5);
    });
}
















