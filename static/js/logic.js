// Set up the URL's
const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const plateUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// set up the categories for the earthquakes
const categories = [0, 1, 2, 3, 4, 5, 6, 7, 8];
// Find the maximum in the categories array
var max = Math.max(...categories);
// set the multiplication factor for the generateColor function
var factor = 255 / max;

// Perform a GET request to the query URLs
(async function(){
  const earthquakeData = await d3.json(earthquakeUrl);
  console.log(earthquakeData.features);

  const plateData = await d3.json(plateUrl);
  console.log(plateData.features);

  // Once we get a response, send the *.features objects to the createFeatures function
  createFeatures(earthquakeData.features, plateData.features);
})()

// Pad a String with 0's
function padWithZeroes(theString, length) {
  var myString = '' + theString;
  while (myString.length < length) {
      myString = `0${myString}`;
  }
  return myString;
}

// Convert decimal to Hex String
function decimalToHexString(number) {
  var numberRound = Math.round(number)
  if (numberRound < 0) {
    numberRound = 0xFFFFFFFF + numberRound + 1;
  }
  var numStr = numberRound.toString(16).toUpperCase();
  numStr = padWithZeroes(numStr, 2);
  return numStr;
}

// Generate a color from green to red based on the Magnitude
function generateColor(magnitude) {
  // find the red value in the range 0-255
  var red = 2 * factor * magnitude;
  if (red < 0) { red = 0; }
  if (red > 255) { red = 255; }
  // find the green value in the range 0-255
  var green = 2 * factor * (max - magnitude);
  if (green < 0) { green = 0; }
  if (green > 255) { green = 255; }
  // get the hex versions
  var redHex = decimalToHexString(red);
  var greenHex = decimalToHexString(green);
  // make the color string and return it
  var colorString = "#" + redHex + greenHex + "00";
  return colorString;
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
      var marker = new L.CircleMarker(latlng, {
        radius: feature.properties.mag * 3,
        fillColor: generateColor(feature.properties.mag),
        fillOpacity: 0.8,
        weight: 1,
        color: "black"
      });
      return marker;
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
    accessToken: API_KEY,
    bounds : [[-90, -180], [90, 180]],
    noWrap: true
  });

  const grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox/light-v10",
    accessToken: API_KEY,
    bounds : [[-90, -180], [90, 180]],
    noWrap: true
  });

  const outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox/outdoors-v11",
    accessToken: API_KEY,
    bounds : [[-90, -180], [90, 180]],
    noWrap: true
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
    center: [37.09, -95.71],
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
    for (var i = 0; i < categories.length; i++) {
      var color_text = categories[i].toString();
      if (i == categories.length - 1) {
        color_text += "+";
      }
      div.innerHTML +=
        labels.push('<i class="circle" style="background:' + generateColor(categories[i]) + '"></i> ' +
                      (color_text ? color_text : '+'));
    }
    div.innerHTML = labels.join('<br>');
    return div;
  };

  legend.addTo(myMap);
}
