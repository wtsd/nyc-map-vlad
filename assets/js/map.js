let map;
let markersLayer;
let markersById = {};

function initMap(allPlaces) {
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([40.7128, -74.0060], 11);

  window.map = map;

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap &copy; CARTO"
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
    const marker = L.circleMarker(p.coords, {
      radius: 8,
      color: "#0f172a",
      weight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 0.92
    });

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
