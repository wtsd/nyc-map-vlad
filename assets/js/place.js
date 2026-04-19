let lang = NYCMapCommon.normalizeLang(localStorage.getItem("lang"));
let places = [];
let currentPlace = null;
let checklist = JSON.parse(localStorage.getItem("checklist") || "{}");
Object.keys(checklist).forEach(id => {
  if (checklist[id] === "favorite") checklist[id] = null;
});

function getText() {
  return {
    en: {
      subtitle: "NYC Map by Vlad and Katya",
      back: "Back",
      maps: "Maps",
      copy: "Copy summary",
      copied: "Summary copied",
      address: "Address:",
      price: "Price:",
      external: "Open source link",
      openInMaps: "Open in maps",
      backToList: "Back to list",
      notFound: "Place not found",
      notFoundText: "The requested place does not exist.",
      photoFallback: "Photo coming later",
      visitedBtn: "Visited",
      copyError: "Could not copy to clipboard"
    },
    ru: {
      subtitle: "Карта Нью-Йорка от Влада и Кати",
      back: "Назад",
      maps: "Карта",
      copy: "Копировать описание",
      copied: "Описание скопировано",
      address: "Адрес:",
      price: "Цена:",
      external: "Открыть источник",
      openInMaps: "Открыть в картах",
      backToList: "Назад к списку",
      notFound: "Место не найдено",
      notFoundText: "Запрошенное место не существует.",
      photoFallback: "Фото будет позже",
      visitedBtn: "Был",
      copyError: "Не удалось скопировать"
    }
  };
}

function saveChecklist() {
  localStorage.setItem("checklist", JSON.stringify(checklist));
}

function getStatusLabel(status) {
  return NYCMapCommon.getStatusLabel(lang, status);
}

function getCategoryLabel(category) {
  return NYCMapCommon.getCategoryLabel(lang, category);
}

function toggleLang() {
  lang = lang === "en" ? "ru" : "en";
  localStorage.setItem("lang", lang);
  render();
}

function setStatus(id, status) {
  checklist[id] = checklist[id] === status ? null : status;
  saveChecklist();
  renderStatus();
}
function setVisited(id, checked) {
  const current = checklist[id] || null;
  if (checked && current !== "visited") checklist[id] = "visited";
  if (!checked && current === "visited") checklist[id] = null;
  saveChecklist();
  renderStatus();
}

function renderStatus() {
  if (!currentPlace) return;

  const t = getText()[lang];
  const status = checklist[currentPlace.id] || "none";

  const visited = document.getElementById("btnVisited");
  if (visited) visited.checked = status === "visited";
}

async function copyCurrentPlace() {
  if (!currentPlace) return;

  const t = getText()[lang];
  const status = checklist[currentPlace.id] || "none";

  const externalUrl = currentPlace.external_link || currentPlace.external_url || "";
  const lines = [
    currentPlace.title[lang] || currentPlace.title.en,
    `${lang === "ru" ? "Статус" : "Status"}: ${getStatusLabel(status)}`,
    "",
    `${t.address} ${NYCMapCommon.getPlaceAddress(currentPlace, lang)}`,
    `${t.price} ${NYCMapCommon.getPriceTier(currentPlace) || "-"}`,
    "",
    currentPlace.summary[lang] || currentPlace.summary.en || ""
  ];
  if (externalUrl) lines.push("", `${t.external}: ${externalUrl}`);
  const text = lines.join("\n");

  const copied = await NYCMapCommon.copyText(text);
  if (!copied) {
    alert(t.copyError);
    return;
  }
  const copyBtnLabel = document.querySelector(".copy-btn .btn-label");
  if (!copyBtnLabel) return;
  const original = t.copy;
  copyBtnLabel.textContent = t.copied;
  setTimeout(() => {
    if (copyBtnLabel.textContent === t.copied) {
      copyBtnLabel.textContent = original;
    }
  }, 1400);
}

function renderNotFound() {
  const t = getText()[lang];
  document.getElementById("pageTitle").textContent = t.notFound;
  document.getElementById("pageSubtitle").textContent = t.subtitle;
  document.querySelector(".place-main").innerHTML = `
    <article class="place-card">
      <div class="place-body">
        <h2 class="card-title">${t.notFound}</h2>
        <p class="summary">${t.notFoundText}</p>
        <div class="card-footer-actions">
          <a class="primary-link-btn" href="index.html">${t.maps}</a>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const t = getText()[lang];
  const { route, id } = NYCMapCommon.getPlaceQueryParams();
  const normalizedRoute = (route || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  const normalizedId = (id || "").trim().toLowerCase();
  currentPlace = places.find((p) => {
    const placeRoute = NYCMapCommon.getPlaceRoute(p).toLowerCase();
    const placeId = String(p.id || "").toLowerCase();
    if (normalizedRoute && placeRoute === normalizedRoute) return true;
    if (normalizedId && placeId === normalizedId) return true;
    return false;
  });

  if (!currentPlace) {
    renderNotFound();
    return;
  }

  const title = NYCMapCommon.getLocalizedText(lang, currentPlace.title, "");
  const fullTitle = title;
  const summary = NYCMapCommon.getLocalizedText(lang, currentPlace.summary, "");
  const address = NYCMapCommon.getPlaceAddress(currentPlace, lang);
  const mapsUrl = NYCMapCommon.getMapsUrl(currentPlace, lang);
  const externalUrl = currentPlace.external_link || currentPlace.external_url || "";
  const category = Array.isArray(currentPlace.category) && currentPlace.category.length
    ? getCategoryLabel(currentPlace.category[0])
    : "";

  document.title = `${fullTitle} | NYC Map by Vlad and Katya`;
  document.getElementById("pageTitle").textContent = fullTitle;
  document.getElementById("pageSubtitle").textContent = t.subtitle;
  document.getElementById("placeName").textContent = fullTitle;
  document.getElementById("placeCategory").textContent = category;
  document.getElementById("placePrice").textContent = NYCMapCommon.getPriceTier(currentPlace) || "-";
  document.getElementById("placeSummary").textContent = summary;
  document.getElementById("placeAddress").textContent = address;
  const placeImage = document.getElementById("placeImage");
  const placeImageFallback = document.getElementById("placeImageFallback");
  if (currentPlace.image) {
    placeImage.style.display = "block";
    placeImageFallback.classList.add("hidden");
    placeImage.src = currentPlace.image;
  } else {
    placeImage.removeAttribute("src");
    placeImage.style.display = "none";
    placeImageFallback.classList.remove("hidden");
  }
  placeImage.alt = title;
  document.getElementById("placeImageFallback").textContent = t.photoFallback;
  document.getElementById("placeAddressLink").href = mapsUrl;
  const externalRow = document.getElementById("placeExternalRow");
  const externalLink = document.getElementById("placeExternalLink");
  const externalLabel = document.getElementById("placeExternalLabel");
  if (externalUrl) {
    externalRow.classList.remove("hidden");
    externalLink.href = externalUrl;
    externalLabel.textContent = t.external;
  } else {
    externalRow.classList.add("hidden");
    externalLink.href = "#";
    externalLabel.textContent = "";
  }
  document.getElementById("openMapLink").href = mapsUrl;
  const metaDescription = document.getElementById("placeMetaDescription");
  if (metaDescription) {
    metaDescription.setAttribute("content", summary || title);
  }

  const visitedToggle = document.getElementById("btnVisited");
  if (visitedToggle) visitedToggle.setAttribute("aria-label", t.visitedBtn);

  const backBtn = document.querySelector(".header-buttons a");
  const backBtnLabel = backBtn?.querySelector(".btn-label");
  if (backBtnLabel) backBtnLabel.textContent = t.back;

  const copyBtn = document.querySelector(".copy-btn");
  const copyBtnLabel = copyBtn?.querySelector(".btn-label");
  if (copyBtnLabel) copyBtnLabel.textContent = t.copy;

  const openMapLabel = document.querySelector("#openMapLink .btn-label");
  if (openMapLabel) openMapLabel.textContent = t.openInMaps;
  const backToListLabel = document.querySelector("#backToListLink .btn-label");
  if (backToListLabel) backToListLabel.textContent = t.backToList;
  const metaAddressLabel = document.getElementById("metaAddressLabel");
  if (metaAddressLabel) metaAddressLabel.textContent = t.address;
  const metaPriceLabel = document.getElementById("metaPriceLabel");
  if (metaPriceLabel) metaPriceLabel.textContent = t.price;

  renderStatus();
}

async function loadData() {
  try {
    const manifest = await NYCMapDataLoader.loadManifest();
    const placesPath = NYCMapDataLoader.resolveAssetPath(manifest, "places", "build/places.json");
    const res = await fetch(placesPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    places = await res.json();
    render();
  } catch (error) {
    console.error("Failed to load place data", error);
    renderNotFound();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

registerServiceWorker();
loadData();
window.setVisited = setVisited;
