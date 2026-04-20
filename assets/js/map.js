let map;
let markersLayer;
let markersById = {};
let activeMarkerId = "";
let activeCardId = "";
let userLocationMarker;
let userLocationAccuracyCircle;
let lastRenderedPlaces = [];
const CATEGORY_COLORS = {
  landmarks: "#3b82f6",
  parks: "#22c55e",
  museums: "#a855f7",
  food: "#f97316",
  viewpoints: "#0ea5e9",
  "hidden-gems": "#14b8a6",
  other: "#64748b"
};
function getCategoryColor(place) {
  const primaryCategory = Array.isArray(place.category) ? place.category[0] : "";
  return CATEGORY_COLORS[primaryCategory] || "#64748b";
}

function getMapStatusText(key) {
  const isRu = NYCMapState.getLang() === "ru";
  const dictionary = {
    noMatchingPlaces: isRu ? "Нет мест по текущим фильтрам." : "No places match the current filters.",
    noValidCoordinates: isRu ? "У выбранных мест нет валидных координат для карты." : "Selected places have no valid coordinates for the map.",
    pointsOutsideViewport: isRu ? "Точки вне текущего окна карты — выполнено автоцентрирование." : "Points were outside the current viewport — auto-fit applied.",
    pointsOutsideViewportManual: isRu ? "Точки вне текущего окна карты — переключитесь на карту для автоцентрирования." : "Points are outside the current viewport — switch to Map tab to auto-fit."
  };
  return dictionary[key] || "";
}

function renderLegend(note = "") {
  const legendEl = document.getElementById("mapLegend");
  if (!legendEl) return;

  const source = CATEGORY_COLORS;
  const selectedCategories = new Set(
    Array.from(document.querySelectorAll("#categoryFilterGroup input:checked")).map((input) => input.value)
  );
  const allActiveClass = selectedCategories.size === 0 ? "active" : "";
  const allLabel = NYCMapState.getLang() === "ru" ? "Все" : "All";
  const allItem = `<li class="map-legend-item ${allActiveClass}">
    <button type="button" class="map-legend-btn" onclick="clearLegendCategoryFilters()">
      <span>${allLabel}</span>
    </button>
  </li>`;
  const items = Object.entries(source).map(([key, color]) => {
    const label = NYCMapCommon.getCategoryLabel(NYCMapState.getLang(), key);
    const activeClass = selectedCategories.has(key) ? "active" : "";
    return `<li class="map-legend-item ${activeClass}">
      <button type="button" class="map-legend-btn" onclick="toggleLegendCategoryFilter('${key}')">
        <span class="map-legend-dot" style="--legend-color: ${color};"></span><span>${label}</span>
      </button>
    </li>`;
  }).join("");

  const title = NYCMapState.getLang() === "ru" ? "Легенда: категории" : "Legend: categories";

  legendEl.innerHTML = `
    <div class="map-legend-title">${title}</div>
    <ul class="map-legend-list">${allItem}${items}</ul>
    ${note ? `<p class="map-legend-note">${note}</p>` : ""}
  `;
}

function isValidMapCoords(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  const rawLat = coords[0];
  const rawLng = coords[1];
  if (typeof rawLat !== "number" || typeof rawLng !== "number") return false;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) return false;
  return true;
}

function getValidPlaces(places) {
  return places.filter((place) => isValidMapCoords(place.coords));
}


function toggleLegendCategoryFilter(category) {
  const input = document.querySelector(`#categoryFilterGroup input[value='${category}']`);
  if (!input) return;
  input.checked = !input.checked;
  if (typeof onFiltersChanged === "function") onFiltersChanged();
}

function clearLegendCategoryFilters() {
  document.querySelectorAll("#categoryFilterGroup input:checked").forEach((input) => {
    input.checked = false;
  });
  if (typeof onFiltersChanged === "function") onFiltersChanged();
}

function initMap(allPlaces) {
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([40.7128, -74.0060], isMobile ? 10 : 11);

  window.map = map;

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  }).addTo(map);

  markersLayer = L.markerClusterGroup({
    chunkedLoading: true,
    chunkInterval: 120,
    chunkDelay: 24,
    maxClusterRadius: (zoom) => (zoom < 11 ? 56 : 40),
    disableClusteringAtZoom: 15,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false
  }).addTo(map);
  refreshMap(allPlaces);
}

function renderPopupContent(place, lang, title) {
  const buttonText = lang === "ru" ? "К карточке" : "Show card";
  const subtitle = NYCMapCommon.getCategoryLabel(lang, Array.isArray(place.category) ? place.category[0] : "");
  return `
    <div class="map-popup">
      <strong class="map-popup-title">${title}</strong>
      <span class="map-popup-subtitle">${subtitle}</span>
      <button type="button" class="secondary-btn map-popup-btn" onclick="scrollToCard('${place.id}', true)">${buttonText}</button>
    </div>
  `;
}

function setMarkerActiveState(id, isActive) {
  const marker = markersById[id];
  if (!marker) return;

  const place = marker.__placeData;
  const markerColor = getCategoryColor(place);
  marker.setStyle({
    radius: isActive ? 10 : 8,
    weight: isActive ? 3 : 2,
    color: isActive ? "#111827" : "#0f172a",
    fillColor: markerColor,
    fillOpacity: isActive ? 1 : 0.92
  });
}

function clearActiveCard() {
  if (!activeCardId) return;
  const current = document.getElementById(`card-${activeCardId}`);
  if (current) current.classList.remove("card-map-active");
  activeCardId = "";
}

function setActiveCard(id) {
  clearActiveCard();
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  card.classList.add("card-map-active");
  activeCardId = id;
}

function setActiveMarker(id, { openPopup = false, panTo = false } = {}) {
  if (activeMarkerId && activeMarkerId !== id) setMarkerActiveState(activeMarkerId, false);
  activeMarkerId = id || "";
  if (!id) return;

  setMarkerActiveState(id, true);
  const marker = markersById[id];
  if (!marker) return;

  if (panTo) map.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
  if (openPopup) marker.openPopup();
}

function fitBoundsToPlaces(validPlaces) {
  if (!validPlaces.length) return false;
  map.fitBounds(validPlaces.map((p) => p.coords), {
    padding: [24, 24],
    maxZoom: window.matchMedia("(max-width: 760px)").matches ? 12 : 13
  });
  return true;
}

function refreshMap(currentPlaces, options = {}) {
  if (!map || !markersLayer) return;

  const { shouldFitBounds = false } = options;
  lastRenderedPlaces = Array.isArray(currentPlaces) ? currentPlaces : [];
  markersLayer.clearLayers();

  const validPlaces = getValidPlaces(lastRenderedPlaces);
  const excludedCount = Math.max(0, lastRenderedPlaces.length - validPlaces.length);

  validPlaces.forEach((p) => {
    const lang = NYCMapState.getLang();
    const title = p.title?.[lang] || p.title?.en || p.id;
    let marker = markersById[p.id];
    if (!marker) {
      marker = L.circleMarker(p.coords, {});
      marker.on("click", () => {
        setActiveCard(p.id);
        setActiveMarker(p.id, { openPopup: false });
        scrollToCard(p.id, false);
      });
      markersById[p.id] = marker;
    }

    marker.__placeData = p;
    marker.setLatLng(p.coords);
    marker.bindPopup(renderPopupContent(p, lang, title));
    setMarkerActiveState(p.id, activeMarkerId === p.id);
    marker.addTo(markersLayer);
  });

  if (activeMarkerId && !validPlaces.find((p) => p.id === activeMarkerId)) {
    activeMarkerId = "";
  }

  let note = "";
  if (!lastRenderedPlaces.length) {
    note = getMapStatusText("noMatchingPlaces");
  } else if (!validPlaces.length) {
    note = getMapStatusText("noValidCoordinates");
  }

  if (excludedCount > 0) {
    const excludedMessage = NYCMapState.getLang() === "ru"
      ? `Исключено из карты из-за невалидных координат: ${excludedCount}.`
      : `Excluded from map due to invalid coordinates: ${excludedCount}.`;
    note = note ? `${note} ${excludedMessage}` : excludedMessage;
  }

  if (validPlaces.length) {
    const mapBounds = map.getBounds();
    const pointsInViewport = validPlaces.filter((place) => mapBounds.contains(place.coords)).length;
    if (shouldFitBounds || (!map.__hasAutoFit && validPlaces.length)) {
      fitBoundsToPlaces(validPlaces);
      map.__hasAutoFit = true;
      if (pointsInViewport === 0 && !shouldFitBounds) note = getMapStatusText("pointsOutsideViewport");
    } else if (pointsInViewport === 0) {
      note = getMapStatusText("pointsOutsideViewportManual");
    }
  }

  renderLegend(note);
}

function handleMapBecameVisible() {
  if (!map) return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      refreshMap(lastRenderedPlaces, { shouldFitBounds: true });
    });
  });
}

function scrollToCard(id, shouldOpenPopup = false) {
  const el = document.getElementById(`card-${id}`);
  if (!el) return;

  setActiveCard(id);
  setActiveMarker(id, { openPopup: shouldOpenPopup, panTo: false });
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function focusMarkerFromCard(id, shouldOpenPopup = true) {
  const marker = markersById[id];
  if (!marker) return;
  setActiveCard(id);
  setActiveMarker(id, { openPopup: shouldOpenPopup, panTo: true });
}

function locateUser() {
  if (!map) return;

  if (!navigator.geolocation) {
    alert(NYCMapState.getLang() === "ru" ? "Геолокация не поддерживается браузером" : "Geolocation is not supported by your browser");
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
        `${NYCMapState.getLang() === "ru" ? "Вы здесь" : "You are here"}<br>${NYCMapState.getLang() === "ru" ? "Точность" : "Accuracy"}: ±${Math.round(accuracy)}m`
      );
      userLocationMarker.openPopup();
      map.setView(userLatLng, Math.max(map.getZoom(), 14));
    },
    (error) => {
      const messages = {
        1: NYCMapState.getLang() === "ru" ? "Доступ к геолокации запрещен" : "Location access was denied",
        2: NYCMapState.getLang() === "ru" ? "Не удалось определить местоположение" : "Could not determine location",
        3: NYCMapState.getLang() === "ru" ? "Время ожидания геолокации истекло" : "Location request timed out"
      };
      alert(messages[error.code] || (NYCMapState.getLang() === "ru" ? "Ошибка геолокации" : "Geolocation error"));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

window.focusMarkerFromCard = focusMarkerFromCard;
window.toggleLegendCategoryFilter = toggleLegendCategoryFilter;

window.handleMapBecameVisible = handleMapBecameVisible;
