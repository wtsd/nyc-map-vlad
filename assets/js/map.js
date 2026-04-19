let map;
let markersLayer;
let markersById = {};
let userLocationMarker;
let userLocationAccuracyCircle;

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
