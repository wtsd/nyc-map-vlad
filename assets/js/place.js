let lang = NYCMapCommon.normalizeLang(localStorage.getItem("lang"));
let places = [];
let currentPlace = null;
let checklist = JSON.parse(localStorage.getItem("checklist") || "{}");

function getText() {
  return {
    en: {
      subtitle: "NYC Map by Vlad and Katya",
      back: "Back",
      openMap: "Open map",
      copy: "Copy",
      transit: "Transit:",
      notFound: "Place not found",
      notFoundText: "The requested place does not exist.",
      photoFallback: "Photo coming later",
      wantBtn: "Want",
      visitedBtn: "Visited",
      favoriteBtn: "Favorite",
      skipBtn: "Skip",
      copyError: "Could not copy to clipboard"
    },
    ru: {
      subtitle: "Карта Нью-Йорка от Влада и Кати",
      back: "Назад",
      openMap: "Открыть карту",
      copy: "Копировать",
      transit: "Транспорт:",
      notFound: "Место не найдено",
      notFoundText: "Запрошенное место не существует.",
      photoFallback: "Фото будет позже",
      wantBtn: "Хочу",
      visitedBtn: "Был",
      favoriteBtn: "Любимое",
      skipBtn: "Пропустить",
      copyError: "Не удалось скопировать"
    }
  };
}

function q(name) {
  return new URLSearchParams(window.location.search).get(name);
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
  document.getElementById("btnFavorite").classList.toggle("active", status === "favorite");
  document.getElementById("btnSkip").classList.toggle("active", status === "skip");
}

async function copyCurrentPlace() {
  if (!currentPlace) return;

  const t = getText()[lang];
  const status = checklist[currentPlace.id] || "none";

  const text = [
    currentPlace.title[lang] || currentPlace.title.en,
    `${lang === "ru" ? "Статус" : "Status"}: ${getStatusLabel(status)}`,
    "",
    `${t.transit} ${currentPlace.transit?.[lang] || currentPlace.transit?.en || ""}`,
    `${lang === "ru" ? "Время" : "Time"}: ${getTimeLabel(currentPlace.time)}`,
    `${lang === "ru" ? "Цена" : "Cost"}: ${getCostLabel(currentPlace.cost, currentPlace.price)}`,
    "",
    currentPlace.summary[lang] || currentPlace.summary.en || ""
  ].join("\n");

  const copied = await NYCMapCommon.copyText(text);
  if (!copied) {
    alert(t.copyError);
  }
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
          <a class="primary-link-btn" href="index.html">${t.openMap}</a>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const t = getText()[lang];
  const id = q("id");
  currentPlace = places.find(p => p.id === id);

  if (!currentPlace) {
    renderNotFound();
    return;
  }

  const title = currentPlace.title[lang] || currentPlace.title.en;
  const summary = currentPlace.summary[lang] || currentPlace.summary.en || "";
  const transit = currentPlace.transit?.[lang] || currentPlace.transit?.en || "";
  const category = Array.isArray(currentPlace.category) && currentPlace.category.length
    ? getCategoryLabel(currentPlace.category[0])
    : "";

  document.title = `${title} | NYC Map by Vlad and Katya`;
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSubtitle").textContent = t.subtitle;
  document.getElementById("placeName").textContent = title;
  document.getElementById("placeCategory").textContent = category;
  document.getElementById("placeTime").textContent = getTimeLabel(currentPlace.time);
  document.getElementById("placeCost").textContent = getCostLabel(currentPlace.cost, currentPlace.price);
  document.getElementById("placeSummary").textContent = summary;
  document.getElementById("placeTransit").textContent = transit;
  document.getElementById("placeImage").src = currentPlace.image || "assets/images/placeholders/cover.jpg";
  document.getElementById("placeImage").alt = title;
  document.getElementById("placeImageFallback").textContent = t.photoFallback;
  document.getElementById("openMapLink").href = "index.html";
  document.getElementById("transitLabel").textContent = t.transit;

  const statusButtons = [
    { id: "btnWant", label: t.wantBtn },
    { id: "btnVisited", label: t.visitedBtn },
    { id: "btnFavorite", label: t.favoriteBtn },
    { id: "btnSkip", label: t.skipBtn }
  ];
  statusButtons.forEach(({ id, label }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute("aria-label", label);
    const srLabel = btn.querySelector(".sr-only");
    if (srLabel) srLabel.textContent = label;
  });

  const backBtn = document.querySelector(".header-buttons a");
  const backBtnLabel = backBtn?.querySelector(".btn-label");
  if (backBtnLabel) backBtnLabel.textContent = t.back;

  const copyBtn = document.querySelector(".copy-btn");
  const copyBtnLabel = copyBtn?.querySelector(".btn-label");
  if (copyBtnLabel) copyBtnLabel.textContent = t.copy;

  const openMapLabel = document.querySelector("#openMapLink .btn-label");
  if (openMapLabel) openMapLabel.textContent = t.openMap;

  const openMapsLink = document.getElementById("openMapsLink");
  if (openMapsLink) {
    openMapsLink.href = getMapsUrl(currentPlace);
    openMapsLink.textContent = lang === "ru" ? "Карта" : "Maps";
  }

  renderStatus();
}

async function loadData() {
  try {
    const res = await fetch("build/places.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    places = await res.json();
    render();
  } catch (error) {
    console.error("Failed to load place data", error);
    renderNotFound();
  }
}

function getMapsUrl(place) {
  const query = place.address || place.title?.[lang] || place.title?.en || place.id;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

loadData();
