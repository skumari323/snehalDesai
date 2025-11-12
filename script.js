const API_URL = 'ajax/proxy.api.php';


function handleResponse(preId, response) {
    $(`#${preId}`).text(JSON.stringify(response, null, 2));
}

function handleError(preId, xhr, status, error) {
    let msg = `Status: ${status}\nError: ${error}`;
    if (xhr.responseText) {
        msg += `\nResponse: ${xhr.responseText}`;
    }
    $(`#${preId}`).text(msg);
}


function callAPI(action, params, resultId) {
    $.ajax({
        url: API_URL,
        type: 'GET',
        data: { action, ...params },
        dataType: 'json',
        success: (response) => handleResponse(resultId, response),
        error: (xhr, status, error) => handleError(resultId, xhr, status, error)
    });
}

// -----------------------------
// Address API
// -----------------------------
function callAddressAPI() {
    const lat = $('#addrLat').val().trim();
    const lng = $('#addrLng').val().trim();
    callAPI('address', { lat, lng }, 'addrResult');
}

// -----------------------------
// Earthquake API
// -----------------------------
function callEarthquakeAPI() {
    const params = {
        north: $('#eqNorth').val().trim(),
        south: $('#eqSouth').val().trim(),
        east: $('#eqEast').val().trim(),
        west: $('#eqWest').val().trim(),
        minMagnitude: $('#eqMinMag').val().trim()
    };
    callAPI('earthquakes', params, 'eqResult');
}

// -----------------------------
// Weather API
// -----------------------------
function callWeatherAPI() {
    const lat = $('#wxLat').val().trim();
    const lng = $('#wxLng').val().trim();
    callAPI('weather', { lat, lng }, 'wxResult');
}

console.log("✅ script.js loaded successfully");


