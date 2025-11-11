




// Address API
async function callAddressAPI() {
  const lat = document.getElementById('addrLat').value;
  const lng = document.getElementById('addrLng').value;
  const res = await fetch(`api.php?type=address&lat=${lat}&lng=${lng}`);
  const data = await res.json();
  document.getElementById('addrResult').textContent = JSON.stringify(data, null, 2);
}

// Earthquakes API
async function callEarthquakeAPI() {
  const north = document.getElementById('eqNorth').value;
  const south = document.getElementById('eqSouth').value;
  const east = document.getElementById('eqEast').value;
  const west = document.getElementById('eqWest').value;
  const minMag = document.getElementById('eqMinMag').value;
  const res = await fetch(`api.php?type=earthquakes&north=${north}&south=${south}&east=${east}&west=${west}&minMag=${minMag}`);
  const data = await res.json();
  document.getElementById('eqResult').textContent = JSON.stringify(data, null, 2);
}

// Weather API
async function callWeatherAPI() {
  const lat = document.getElementById('wxLat').value;
  const lng = document.getElementById('wxLng').value;
  const res = await fetch(`api.php?type=weather&lat=${lat}&lng=${lng}`);
  const data = await res.json();
  document.getElementById('wxResult').textContent = JSON.stringify(data, null, 2);
}




