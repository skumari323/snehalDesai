<script>
    

    

    async function callAddressAPI() {
      const lat = document.getElementById('addrLat').value;
      const lng = document.getElementById('addrLng').value;
      const url = `https://api.geonames.org/findNearestAddressJSON?lat=40.748817&lng=73.985428&username=skumari`;
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('addrResult').textContent = JSON.stringify(data, null, 2);
    }

    async function callEarthquakeAPI() {
      const north = document.getElementById('eqNorth').value;
      const south = document.getElementById('eqSouth').value;
      const east = document.getElementById('eqEast').value;
      const west = document.getElementById('eqWest').value;
      const minMag = document.getElementById('eqMinMag').value;
      const url = `https://api.geonames.org/earthquakesJSON?north=${north}&south=${south}&east=${east}&west=${west}&minMagnitude=${minMag}&username=skumari`;
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('eqResult').textContent = JSON.stringify(data, null, 2);
    }

    async function callWeatherAPI() {
      const lat = document.getElementById('wxLat').value;
      const lng = document.getElementById('wxLng').value;
      const url = `https://api.geonames.org/findNearByWeatherJSON?lat=${lat}&lng=${lng}&username=skumari;
      const res = await fetch(url);
      const data = await res.json();
      document.getElementById('wxResult').textContent = JSON.stri




            </script>