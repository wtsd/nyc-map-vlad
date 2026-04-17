let map;
let markersLayer;
let markersById = {};

function initMap(allPlaces) {
  map = L.map("map", {
    zoomControl: true
  }).setView([40.7128, -74.0060], 11);

  window.map = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  refreshMap(allPlaces);
}

function refreshMap(currentPlaces) {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();
  markersById = {};

  currentPlaces.forEach(p => {
    const title = p.title?.[lang] || p.title?.en || p.id;
    const marker = L.marker(p.coords);

    marker.bindPopup(`
      <strong>${title}</strong><br>
      <button onclick="scrollToCard('${p.id}')" style="margin-top:8px; cursor:pointer;">${lang === "ru" ? "К карточке" : "Show card"}</button>
    `);

    marker.on("click", () => {
      scrollToCard(p.id);
    });

    marker.addTo(markersLayer);
    markersById[p.id] = marker;
  });
}

function scrollToCard(id) {
  const el = document.getElementById(`card-${id}`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.outline = "2px solid #111827";
  el.style.outlineOffset = "2px";

  setTimeout(() => {
    el.style.outline = "";
    el.style.outlineOffset = "";
  }, 1500);
}