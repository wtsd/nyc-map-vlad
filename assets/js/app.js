let lang = NYCMapCommon.normalizeLang(localStorage.getItem("lang"));
let places = [];
let checklist = JSON.parse(localStorage.getItem("checklist") || "{}");
let mobileView = "list";
let currentPage = 1;
const pageSize = 25;

function toggleLang() {
  lang = lang === "en" ? "ru" : "en";
  localStorage.setItem("lang", lang);
  render();
}

function saveChecklist() {
  localStorage.setItem("checklist", JSON.stringify(checklist));
}

function setStatus(id, status) {
  checklist[id] = checklist[id] === status ? null : status;
  saveChecklist();
  render();
}

function getStatusLabel(status) {
  return NYCMapCommon.getStatusLabel(lang, status);
}

function getCategoryLabel(category) {
  return NYCMapCommon.getCategoryLabel(lang, category);
}

function getTimeLabel(time) {
  return NYCMapCommon.getTimeLabel(lang, time);
}

function getCostLabel(cost, price) {
  return NYCMapCommon.getCostLabel(lang, cost, price);
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

async function copyPlace(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;

  const status = checklist[id] || "none";
  const text = [
    NYCMapCommon.getLocalizedText(lang, p.title, ""),
    `${lang === "ru" ? "Статус" : "Status"}: ${getStatusLabel(status)}`,
    "",
    `${lang === "ru" ? "Адрес" : "Address"}: ${NYCMapCommon.getPlaceAddress(p, lang)}`,
    `${lang === "ru" ? "Время" : "Time"}: ${getTimeLabel(p.time)}`,
    `${lang === "ru" ? "Цена" : "Cost"}: ${getCostLabel(p.cost, p.price)}`,
    "",
    p.summary[lang] || p.summary.en || ""
  ].join("\n");

  const copied = await NYCMapCommon.copyText(text);
  if (!copied) {
    alert(lang === "ru" ? "Не удалось скопировать" : "Could not copy to clipboard");
  }
}

async function copySummary() {
  const grouped = {
    want: [],
    visited: [],
    favorite: [],
    skip: []
  };

  places.forEach(p => {
    const status = checklist[p.id];
    if (status && grouped[status]) {
      grouped[status].push(p.title[lang] || p.title.en);
    }
  });

  const labels = {
    en: {
      title: "NYC Map by Vlad and Katya",
      want: "Want to visit",
      visited: "Visited",
      favorite: "Favorite",
      skip: "Skip"
    },
    ru: {
      title: "Карта Нью-Йорка от Влада и Кати",
      want: "Хочу посетить",
      visited: "Посетил",
      favorite: "Любимое",
      skip: "Пропустить"
    }
  };

  const t = labels[lang];
  let out = `${t.title}\n\n`;

  ["want", "visited", "favorite", "skip"].forEach(key => {
    if (!grouped[key].length) return;

    out += `${t[key]}:\n`;
    grouped[key].forEach(item => {
      out += `- ${item}\n`;
    });
    out += "\n";
  });

  const copied = await NYCMapCommon.copyText(out.trim());
  if (!copied) {
    alert(lang === "ru" ? "Не удалось скопировать" : "Could not copy to clipboard");
  }
}

function getFilteredPlaces() {
  const category = document.getElementById("categoryFilter")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "";
  const search = (document.getElementById("searchFilter")?.value || "").trim().toLowerCase();

  return places.filter(p => {
    const categoryOk = !category || (Array.isArray(p.category) && p.category.includes(category));
    const statusOk = !status || checklist[p.id] === status;
    if (!categoryOk || !statusOk) return false;
    if (!search) return true;

    const title = `${p.title?.en || ""} ${p.title?.ru || ""}`.toLowerCase();
    const summary = `${p.summary?.en || ""} ${p.summary?.ru || ""}`.toLowerCase();
    const address = `${p.address?.en || ""} ${p.address?.ru || ""}`.toLowerCase();
    const categories = (p.category || []).join(" ").toLowerCase();
    return title.includes(search) || summary.includes(search) || address.includes(search) || categories.includes(search);
  });
}

function onFiltersChanged() {
  currentPage = 1;
  render();
}

function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(getFilteredPlaces().length / pageSize));
  currentPage = Math.min(Math.max(page, 1), totalPages);
  render();
}

function renderPagination(totalItems, totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  if (totalItems <= pageSize) {
    pagination.innerHTML = "";
    pagination.classList.add("hidden");
    return;
  }

  pagination.classList.remove("hidden");
  const prevDisabled = currentPage === 1 ? "disabled" : "";
  const nextDisabled = currentPage === totalPages ? "disabled" : "";

  pagination.innerHTML = `
    <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${prevDisabled} aria-label="Previous page">${lang === "ru" ? "Назад" : "Prev"}</button>
    <span class="page-info">${lang === "ru" ? "Страница" : "Page"} ${currentPage} / ${totalPages}</span>
    <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${nextDisabled} aria-label="Next page">${lang === "ru" ? "Вперед" : "Next"}</button>
  `;
}

function render() {
  const container = document.getElementById("list");
  const resultsCount = document.getElementById("resultsCount");
  const tabList = document.getElementById("tabList");
  const tabMap = document.getElementById("tabMap");
  const searchFilter = document.getElementById("searchFilter");
  const statWantLabel = document.getElementById("statWantLabel");
  const statVisitedLabel = document.getElementById("statVisitedLabel");
  const statFavoriteLabel = document.getElementById("statFavoriteLabel");
  const filtered = getFilteredPlaces();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (currentPage > totalPages) currentPage = totalPages;
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedPlaces = filtered.slice(pageStart, pageStart + pageSize);

  if (!container) return;

  updateStats(filtered);

  if (resultsCount) {
    resultsCount.textContent = lang === "ru"
      ? `${filtered.length} мест • стр. ${currentPage}/${totalPages}`
      : `${filtered.length} places • page ${currentPage}/${totalPages}`;
  }
  if (tabList) tabList.textContent = lang === "ru" ? "Список" : "List";
  if (tabMap) tabMap.textContent = lang === "ru" ? "Карта" : "Map";
  if (searchFilter) {
    searchFilter.placeholder = lang === "ru" ? "Поиск мест" : "Search places";
  }
  if (statWantLabel) statWantLabel.textContent = lang === "ru" ? "➕ Хочу" : "➕ Want";
  if (statVisitedLabel) statVisitedLabel.textContent = lang === "ru" ? "✅ Был" : "✅ Visited";
  if (statFavoriteLabel) statFavoriteLabel.textContent = lang === "ru" ? "❤️ Любимое" : "❤️ Favorite";

  container.innerHTML = "";

  paginatedPlaces.forEach(p => {
    const status = checklist[p.id] || "none";
    const imageSrc = p.image || "assets/images/placeholders/cover.jpg";
    const title = NYCMapCommon.getLocalizedText(lang, p.title, "");
    const summary = truncate(NYCMapCommon.getLocalizedText(lang, p.summary, ""), 180);
    const address = NYCMapCommon.getPlaceAddress(p, lang);
    const category = Array.isArray(p.category) && p.category.length ? getCategoryLabel(p.category[0]) : "";
    const detailsUrl = `place.html?id=${encodeURIComponent(p.id)}`;

    const el = document.createElement("article");
    el.className = "card";
    el.id = `card-${p.id}`;

    el.innerHTML = `
      <a class="card-image-wrap card-image-link" href="${detailsUrl}" aria-label="${lang === "ru" ? "Открыть карточку места" : "Open place details"}">
        <img src="${imageSrc}" alt="${title}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
        <div class="card-image-fallback hidden">${lang === "ru" ? "Фото будет позже" : "Photo coming later"}</div>
      </a>

      <div class="card-body">
        <div class="card-topline">
          <div class="card-title-wrap">
            <h3 class="card-title">
              <a class="card-title-link" href="${detailsUrl}">${title}</a>
            </h3>
            <button class="copy-btn card-copy-btn" onclick="copyPlace('${p.id}')" aria-label="${lang === "ru" ? "Скопировать карточку" : "Copy place details"}" title="${lang === "ru" ? "Скопировать" : "Copy"}">
              <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="9" y="9" width="11" height="11" rx="2"></rect>
                <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>
              </svg>
              <span class="sr-only">${lang === "ru" ? "Копировать" : "Copy"}</span>
            </button>
          </div>
          <div class="card-category">${category}</div>
        </div>

        <div class="transit-row">
          <a class="address-btn" href="${NYCMapCommon.getMapsUrl(p, lang)}" target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">📍</span>
            <span>${address}</span>
          </a>
        </div>

        <p class="summary">${summary}</p>

        <div class="meta-row">
          <span class="chip ${p.time === "short" ? "is-muted" : ""}">${getTimeLabel(p.time)}</span>
          <span class="chip ${p.cost === "free" ? "is-muted" : ""}">${getCostLabel(p.cost, p.price)}</span>
        </div>

        <div class="status-row">
          <div class="status-toggle-wrap">
            <button class="status-btn ${status === "want" ? "active" : ""}" onclick="setStatus('${p.id}', 'want')">➕ ${lang === "ru" ? "Хочу" : "Want"}</button>
            <button class="status-btn ${status === "visited" ? "active" : ""}" onclick="setStatus('${p.id}', 'visited')">✅ ${lang === "ru" ? "Был" : "Visited"}</button>
            <button class="status-btn ${status === "favorite" ? "active" : ""}" onclick="setStatus('${p.id}', 'favorite')">❤️</button>
            <button class="status-btn ${status === "skip" ? "active" : ""}" onclick="setStatus('${p.id}', 'skip')">🚫</button>
          </div>
        </div>

      </div>
    `;

    container.appendChild(el);
  });

  if (typeof refreshMap === "function") {
    refreshMap(filtered);
  }

  renderPagination(filtered.length, totalPages);

  applyMobileTabState();
}

async function loadData() {
  try {
    const res = await fetch("build/places.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    places = await res.json();
    render();
    initMap(places);
  } catch (error) {
    console.error("Failed to load places.json", error);
    const resultsCount = document.getElementById("resultsCount");
    if (resultsCount) {
      resultsCount.textContent = lang === "ru" ? "Ошибка загрузки" : "Failed to load data";
    }
  }
}

function toggleMap() {
  const wrap = document.getElementById("mapWrap");
  if (!wrap) return;

  wrap.classList.toggle("hidden");
  setTimeout(() => {
    if (window.map) {
      window.map.invalidateSize();
    }
  }, 50);
}

function switchMobileView(view) {
  mobileView = view === "map" ? "map" : "list";
  applyMobileTabState();
}

function applyMobileTabState() {
  const listSection = document.getElementById("listSection");
  const mapSection = document.getElementById("mapSection");
  const tabList = document.getElementById("tabList");
  const tabMap = document.getElementById("tabMap");
  const mobile = window.matchMedia("(max-width: 760px)").matches;

  if (!listSection || !mapSection || !tabList || !tabMap) return;

  if (!mobile) {
    listSection.classList.remove("mobile-hidden");
    mapSection.classList.remove("mobile-hidden");
  } else {
    listSection.classList.toggle("mobile-hidden", mobileView === "map");
    mapSection.classList.toggle("mobile-hidden", mobileView !== "map");
  }

  tabList.classList.toggle("active", mobileView === "list");
  tabMap.classList.toggle("active", mobileView === "map");
  tabList.setAttribute("aria-selected", String(mobileView === "list"));
  tabMap.setAttribute("aria-selected", String(mobileView === "map"));
}

function updateStats(filtered) {
  const counts = {
    total: filtered.length,
    want: 0,
    visited: 0,
    favorite: 0
  };

  filtered.forEach(p => {
    const status = checklist[p.id];
    if (status === "want") counts.want += 1;
    if (status === "visited") counts.visited += 1;
    if (status === "favorite") counts.favorite += 1;
  });

  const total = document.getElementById("statTotal");
  const want = document.getElementById("statWant");
  const visited = document.getElementById("statVisited");
  const favorite = document.getElementById("statFavorite");

  if (total) total.textContent = counts.total;
  if (want) want.textContent = counts.want;
  if (visited) visited.textContent = counts.visited;
  if (favorite) favorite.textContent = counts.favorite;
}
loadData();
applyMobileTabState();
window.addEventListener("resize", applyMobileTabState);
const yearEl = document.getElementById("footerYear");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
