let map;
let polyline;
let markers = [];

function initMap() {
  map = L.map('map').setView([0, 0], 13); // Initial view set to coordinates [0, 0] and zoom level 13

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  polyline = L.polyline([], { color: 'red' }).addTo(map);
}

function updateMap(lat, lng) {
  const newLatLng = new L.LatLng(lat, lng);
  polyline.addLatLng(newLatLng);

  const marker = L.marker([lat, lng]).addTo(map);
  markers.push(marker);

  map.setView(newLatLng, 15);
}

function resetMap() {
  if (polyline) {
    polyline.setLatLngs([]); // Clear the polyline
  }
  markers.forEach(marker => {
    map.removeLayer(marker); // Remove all markers
  });
  markers = []; // Reset markers array

  map.setView([0, 0], 13); // Reset map view
}

document.addEventListener('DOMContentLoaded', initMap);
