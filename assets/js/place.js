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
      transit: "Transit:",
      cost: "Cost:",
      time: "Time:",
      personal: "Personal rating:",
      external: "Open source link",
      openInMaps: "Open in maps",
      backToList: "Back to list",
      home: "Home",
      noTransit: "Not specified",
      notFound: "Place not found",
      notFoundText: "The requested place does not exist.",
      photoFallback: "Photo coming later",
      wantBtn: "Want",
      visitedBtn: "Visited",
      skipBtn: "Skip",
      statusHint: "Choose one status",
      copyError: "Could not copy to clipboard"
    },
    ru: {
      subtitle: "Карта Нью-Йорка от Влада и Кати",
      back: "Назад",
      maps: "Карта",
      copy: "Копировать описание",
      copied: "Описание скопировано",
      address: "Адрес:",
      transit: "Транспорт:",
      cost: "Цена:",
      time: "Время:",
      personal: "Личная оценка:",
      external: "Открыть источник",
      openInMaps: "Открыть в картах",
      backToList: "Назад к списку",
      home: "Главная",
      noTransit: "Не указано",
      notFound: "Место не найдено",
      notFoundText: "Запрошенное место не существует.",
      photoFallback: "Фото будет позже",
      wantBtn: "Хочу",
      visitedBtn: "Был",
      skipBtn: "Пропустить",
      statusHint: "Выберите один статус",
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

function getTimeLabel(time) {
  return NYCMapCommon.getTimeLabel(lang, time);
}

function getCostLabel(cost, price) {
  return NYCMapCommon.getCostLabel(lang, cost, price);
}

function getCategoryLabel(category) {
  return NYCMapCommon.getCategoryLabel(lang, category);
}

function getPersonalEmoji(personal) {
  return NYCMapCommon.getPersonalEmoji(personal);
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

function renderStatus() {
  if (!currentPlace) return;

  const t = getText()[lang];
  const status = checklist[currentPlace.id] || "none";

  document.getElementById("btnWant").classList.toggle("active", status === "want");
  document.getElementById("btnVisited").classList.toggle("active", status === "visited");
  document.getElementById("btnSkip").classList.toggle("active", status === "skip");
  document.getElementById("btnWant").setAttribute("aria-checked", String(status === "want"));
  document.getElementById("btnVisited").setAttribute("aria-checked", String(status === "visited"));
  document.getElementById("btnSkip").setAttribute("aria-checked", String(status === "skip"));
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
    `${t.transit} ${NYCMapCommon.getLocalizedText(lang, currentPlace.transit, t.noTransit)}`,
    `${lang === "ru" ? "Время" : "Time"}: ${getTimeLabel(currentPlace.time)}`,
    `${lang === "ru" ? "Цена" : "Cost"}: ${getCostLabel(currentPlace.cost, currentPlace.price)}`,
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
  const personalEmoji = getPersonalEmoji(currentPlace.personal);
  const fullTitle = personalEmoji ? `${personalEmoji} ${title}` : title;
  const summary = NYCMapCommon.getLocalizedText(lang, currentPlace.summary, "");
  const address = NYCMapCommon.getPlaceAddress(currentPlace, lang);
  const transit = NYCMapCommon.getLocalizedText(lang, currentPlace.transit, t.noTransit);
  const personal = NYCMapCommon.getPersonalLabel(lang, currentPlace.personal);
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
  document.getElementById("placeSummary").textContent = summary;
  document.getElementById("placeAddress").textContent = address;
  document.getElementById("placeTransit").textContent = transit;
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
  const personalEl = document.getElementById("placePersonal");
  if (personal) {
    personalEl.classList.remove("hidden");
    personalEl.textContent = personal;
  } else {
    personalEl.classList.add("hidden");
    personalEl.textContent = "";
  }
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
  const breadcrumbs = document.getElementById("placeBreadcrumbs");
  if (breadcrumbs) {
    breadcrumbs.innerHTML = `
      <a href="index.html">${t.home}</a>
      <span aria-hidden="true">→</span>
      <span>${category || "—"}</span>
      <span aria-hidden="true">→</span>
      <span aria-current="page">${fullTitle}</span>
    `;
  }
  const metaDescription = document.getElementById("placeMetaDescription");
  if (metaDescription) {
    metaDescription.setAttribute("content", summary || title);
  }

  const statusButtons = [
    { id: "btnWant", label: t.wantBtn },
    { id: "btnVisited", label: t.visitedBtn },
    { id: "btnSkip", label: t.skipBtn }
  ];
  statusButtons.forEach(({ id, label }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute("aria-label", label);
    btn.textContent = label;
  });
  const statusHint = document.querySelector(".status-row-title");
  if (statusHint) statusHint.textContent = t.statusHint;
  const statusGroup = document.querySelector(".status-toggle-wrap");
  if (statusGroup) statusGroup.setAttribute("aria-label", t.statusHint);

  const backBtn = document.querySelector(".header-buttons a");
  const backBtnLabel = backBtn?.querySelector(".btn-label");
  if (backBtnLabel) backBtnLabel.textContent = t.back;

  const copyBtn = document.querySelector(".copy-btn");
  const copyBtnLabel = copyBtn?.querySelector(".btn-label");
  if (copyBtnLabel) copyBtnLabel.textContent = t.copy;

  const openMapLabel = document.querySelector("#openMapLink .btn-label");
  if (openMapLabel) openMapLabel.textContent = t.openInMaps;
  const backToListTopLabel = document.querySelector("#backToListTopLink .btn-label");
  if (backToListTopLabel) backToListTopLabel.textContent = t.backToList;
  const metaTransitLabel = document.getElementById("metaTransitLabel");
  if (metaTransitLabel) metaTransitLabel.textContent = t.transit;

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
