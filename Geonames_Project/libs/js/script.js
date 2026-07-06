$(document).ready(function () {

    //
    // ADDRESS API
    //
    $('#callAddressAPI').click(function () {
        let lat = $('#addrLat').val();
        let lng = $('#addrLng').val();

        $.ajax({
            url: 'ajax/proxy.api.php',
            type: 'GET',
            data: {
                api: 'address',
                lat: lat,
                lng: lng
            },
            success: function (result) {
                $('#addrResult').text(JSON.stringify(result, null, 2));
            },
            error: function () {
                $('#addrResult').text('Error: Could not retrieve address data.');
            }
        });
    });



    //
    // EARTHQUAKE API
    //
    $('#callEarthquakeAPI').click(function () {
        let north = $('#eqNorth').val();
        let south = $('#eqSouth').val();
        let east  = $('#eqEast').val();
        let west  = $('#eqWest').val();

        $.ajax({
            url: 'ajax/proxy.api.php',
            type: 'GET',
            data: {
                api: 'earthquakes',
                north: north,
                south: south,
                east: east,
                west: west
            },
            success: function (result) {
                $('#eqResult').text(JSON.stringify(result, null, 2));
            },
            error: function () {
                $('#eqResult').text('Error: Could not retrieve earthquake data.');
            }
        });
    });



    //
    // WEATHER API
    //
    $('#callWeatherAPI').click(function () {
        let lat = $('#wxLat').val();
        let lng = $('#wxLng').val();

        $.ajax({
            url: 'ajax/proxy.api.php',
            type: 'GET',
            data: {
                api: 'weather',
                lat: lat,
                lng: lng
            },
            success: function (result) {
                $('#wxResult').text(JSON.stringify(result, null, 2));
            },
            error: function () {
                $('#wxResult').text('Error: Could not retrieve weather data.');
            }
        });
    });

});