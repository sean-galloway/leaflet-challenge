// Set up the URL's
const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const plateUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

// Perform a GET request to the query URL
(async function(){
  const earthquakeData = await d3.json(earthquakeUrl);
  console.log(earthquakeData.features)

  const plateData = await d3.json(plateUrl);
  console.log(plateData.features)

  // Once we get a response, send the data.features objects to the createFeatures function
  createFeatures(earthquakeData.features, plateData.features);
})()

function getColor(magnitude) {
  return  magnitude > 5  ?  '#ee6c6e' :
          magnitude > 4  ?  '#eea770' :
          magnitude > 3  ?  '#f2b957' :
          magnitude > 2  ?  '#f2db5a' :
          magnitude > 1  ?  '#e2f15b' :
                            '#b8f15a' ;
}

function createFeatures(earthquakeData, plateData) {
  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place, magnitude and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place + "</h3>" +
    "Magnitude: <strong>" + feature.properties.mag + "</strong><hr>" +
      "<p>" + new Date(feature.properties.time) + "</p>");
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function(feature, latlng) {
      return new L.CircleMarker(latlng, {
          radius: feature.properties.mag * 5,
          fillColor: getColor(feature.properties.mag),
          fillOpacity: 1.0,
          weight: 1,
          color: "black"
      });
    },
    onEachFeature: onEachFeature
  });

  // Create a GeoJSON layer for the platesData object
  var plates = L.geoJSON(plateData, { color: "salmon" });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, plates);
}

function createMap(earthquakes, plates) {

  // Define satellite, grayscale and darkmap layers
  const satellite = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/satellite-streets-v11',
    accessToken: API_KEY
});

const grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox/light-v10",
    accessToken: API_KEY
});

const outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox/outdoors-v11",
    accessToken: API_KEY
});

// Define a baseMaps object to hold our base layers
const baseMaps = {
    "Satellite": satellite,
    "Grayscale": grayscale,
    "Outdoors": outdoors
};

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    Plates: plates
  };

  // Create our map, giving it the satellite, plates and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [satellite, plates, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Keep the earthquakes layer on top at all times when it is on
  myMap.on("overlayadd", function (event) {
    earthquakes.bringToFront();
  });

  // Add in our legend
  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (myMap) {
    let div = L.DomUtil.create('div', 'info legend');
    var labels = ['<strong>Magnitude</strong>'];
    var categories = ['0-1','1-2','2-3','3-4','4-5','5+'];
    var categories_color = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];

    for (var i = 0; i < categories.length; i++) {
        div.innerHTML +=
          labels.push(
                        '<i class="circle" style="background:' + getColor(categories_color[i]) + '"></i> ' +
                        (categories[i] ? categories[i] : '+'));
    }
    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(myMap);
}
