let map;

function initMap(places) {
  map = L.map('map').setView([40.7128, -74.0060], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  places.forEach(p => {
    const marker = L.marker(p.coords).addTo(map);
    marker.bindPopup(p.title["en"]);
  });
}
