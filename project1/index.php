<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gazetteer Project</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <style>
        html, body {
            height: 100%;
            margin: 0;
        }
        #map {
            height: 80vh; /* Adjust map height */
            width: 100%;
        }
        .controls {
            padding: 10px;
            background: #f8f9fa;
        }
    </style>
</head>
<body>

<div class="container-fluid">
    <div class="row controls">
        <div class="col-md-4">
            <label for="countrySelect" class="form-label">Select Country:</label>
            <select id="countrySelect" class="form-select">
                <option value="">-- Select Country --</option>
            </select>
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <div id="map"></div>
        </div>
    </div>
</div>

<!-- Bootstrap JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"></script>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Your custom script -->
<script src="js/script.js"></script>

</body>
</html>









