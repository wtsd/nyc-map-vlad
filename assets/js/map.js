let map;
let markersLayer;
let markersById = {};
let userLocationMarker;
let userLocationAccuracyCircle;
const CATEGORY_COLORS = {
  landmarks: "#3b82f6",
  parks: "#22c55e",
  museums: "#a855f7",
  food: "#f97316",
  viewpoints: "#0ea5e9",
  "hidden-gems": "#14b8a6",
  other: "#64748b"
};
const PERSONAL_COLORS = {
  "want-to-go": "#3b82f6",
  "been-not-impressed": "#94a3b8",
  "highly-recommend": "#22c55e"
};

function getMarkerMode() {
  const selectedCategory = document.getElementById("categoryFilter")?.value || "";
  return selectedCategory ? "personal" : "category";
}

function getColorByMode(place, mode) {
  if (mode === "personal") {
    return PERSONAL_COLORS[place.personal] || "#64748b";
  }
  const primaryCategory = Array.isArray(place.category) ? place.category[0] : "";
  return CATEGORY_COLORS[primaryCategory] || "#64748b";
}

function renderLegend(mode) {
  const legendEl = document.getElementById("mapLegend");
  if (!legendEl) return;

  const source = mode === "personal" ? PERSONAL_COLORS : CATEGORY_COLORS;
  const items = Object.entries(source).map(([key, color]) => {
    const label = mode === "personal"
      ? NYCMapCommon.getPersonalLabel(lang, key)
      : NYCMapCommon.getCategoryLabel(lang, key);
    return `<li class="map-legend-item"><span class="map-legend-dot" style="--legend-color: ${color};"></span><span>${label}</span></li>`;
  }).join("");

  const title = mode === "personal"
    ? (lang === "ru" ? "Легенда: личная оценка" : "Legend: personal")
    : (lang === "ru" ? "Легенда: категории" : "Legend: categories");

  legendEl.innerHTML = `
    <div class="map-legend-title">${title}</div>
    <ul class="map-legend-list">${items}</ul>
  `;
}

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
  const markerMode = getMarkerMode();
  renderLegend(markerMode);

  currentPlaces.forEach(p => {
    const title = p.title?.[lang] || p.title?.en || p.id;
    const markerColor = getColorByMode(p, markerMode);
    const marker = L.circleMarker(p.coords, {
      radius: 8,
      color: "#0f172a",
      weight: 2,
      fillColor: markerColor,
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

function locateUser() {
  if (!map) return;

  if (!navigator.geolocation) {
    alert(lang === "ru" ? "Геолокация не поддерживается браузером" : "Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const userLatLng = [latitude, longitude];

      if (userLocationMarker) {
        userLocationMarker.setLatLng(userLatLng);
      } else {
        userLocationMarker = L.circleMarker(userLatLng, {
          radius: 9,
          color: "#b91c1c",
          weight: 3,
          fillColor: "#f97316",
          fillOpacity: 0.95
        }).addTo(map);
      }

      if (userLocationAccuracyCircle) {
        userLocationAccuracyCircle.setLatLng(userLatLng);
        userLocationAccuracyCircle.setRadius(accuracy);
      } else {
        userLocationAccuracyCircle = L.circle(userLatLng, {
          radius: accuracy,
          color: "#fb923c",
          weight: 1,
          fillColor: "#fed7aa",
          fillOpacity: 0.28
        }).addTo(map);
      }

      userLocationMarker.bindPopup(
        `${lang === "ru" ? "Вы здесь" : "You are here"}<br>${lang === "ru" ? "Точность" : "Accuracy"}: ±${Math.round(accuracy)}m`
      );
      userLocationMarker.openPopup();
      map.setView(userLatLng, Math.max(map.getZoom(), 14));
    },
    (error) => {
      const messages = {
        1: lang === "ru" ? "Доступ к геолокации запрещен" : "Location access was denied",
        2: lang === "ru" ? "Не удалось определить местоположение" : "Could not determine location",
        3: lang === "ru" ? "Время ожидания геолокации истекло" : "Location request timed out"
      };
      alert(messages[error.code] || (lang === "ru" ? "Ошибка геолокации" : "Geolocation error"));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}
