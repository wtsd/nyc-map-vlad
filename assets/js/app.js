let lang = localStorage.getItem("lang") || "en";
let places = [];
let checklist = JSON.parse(localStorage.getItem("checklist") || "{}");

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
  const labels = {
    en: {
      none: "Not set",
      want: "Want to visit",
      visited: "Visited",
      favorite: "Favorite",
      skip: "Skip"
    },
    ru: {
      none: "Не выбрано",
      want: "Хочу посетить",
      visited: "Посетил",
      favorite: "Любимое",
      skip: "Пропустить"
    }
  };
  return labels[lang][status || "none"];
}

function getCategoryLabel(category) {
  const labels = {
    landmarks: { en: "Landmark", ru: "Место" },
    parks: { en: "Park", ru: "Парк" },
    museums: { en: "Museum", ru: "Музей" },
    food: { en: "Food", ru: "Еда" },
    viewpoints: { en: "Viewpoint", ru: "Вид" },
    "hidden-gems": { en: "Hidden gem", ru: "Скрытое место" },
    other: { en: "Other", ru: "Другое" }
  };
  return labels[category]?.[lang] || category;
}

function getTimeLabel(time) {
  const labels = {
    short: { en: "Under 30 min", ru: "До 30 минут" },
    medium: { en: "Couple of hours", ru: "Пара часов" },
    full: { en: "Whole day", ru: "Весь день" }
  };
  return labels[time]?.[lang] || time;
}

function getCostLabel(cost, price) {
  if (cost === "free") return lang === "ru" ? "Бесплатно" : "Free";
  if (cost === "paid") {
    return price
      ? `${lang === "ru" ? "Платно" : "Paid"} ${price}`
      : lang === "ru" ? "Платно" : "Paid";
  }
  return cost || "";
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "..." : text;
}

function copyPlace(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;

  const status = checklist[id] || "none";
  const text = [
    p.title[lang] || p.title.en,
    `${lang === "ru" ? "Статус" : "Status"}: ${getStatusLabel(status)}`,
    "",
    `${lang === "ru" ? "Транспорт" : "Transit"}: ${p.transit?.[lang] || p.transit?.en || ""}`,
    `${lang === "ru" ? "Время" : "Time"}: ${getTimeLabel(p.time)}`,
    `${lang === "ru" ? "Цена" : "Cost"}: ${getCostLabel(p.cost, p.price)}`,
    "",
    p.summary[lang] || p.summary.en || ""
  ].join("\n");

  navigator.clipboard.writeText(text);
}

function copySummary() {
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
    if (grouped[key].length) {
      out += `${t[key]}:\n`;
      grouped[key].forEach(item => {
        out += `- ${item}\n`;
      });
      out += `\n`;
    }
  });

  navigator.clipboard.writeText(out.trim());
}

function getFilteredPlaces() {
  const category = document.getElementById("categoryFilter")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "";

  return places.filter(p => {
    const categoryOk = !category || (Array.isArray(p.category) && p.category.includes(category));
    const statusOk = !status || checklist[p.id] === status;
    return categoryOk && statusOk;
  });
}

function render() {
  const container = document.getElementById("list");
  const resultsCount = document.getElementById("resultsCount");
  const filtered = getFilteredPlaces();
  updateStats(filtered);

  if (resultsCount) {
    resultsCount.textContent =
      lang === "ru"
        ? `${filtered.length} мест`
        : `${filtered.length} places`;
  }

  container.innerHTML = "";

  filtered.forEach(p => {
    const status = checklist[p.id] || "none";
    const imageSrc = p.image || "assets/images/placeholders/cover.jpg";
    const title = p.title[lang] || p.title.en;
    const summary = truncate(p.summary[lang] || p.summary.en || "", 180);
    const transit = p.transit?.[lang] || p.transit?.en || "";
    const category = Array.isArray(p.category) && p.category.length ? getCategoryLabel(p.category[0]) : "";
    const detailsUrl = `place.html?id=${encodeURIComponent(p.id)}`;

    const el = document.createElement("article");
    el.className = "card";
    el.id = `card-${p.id}`;

    el.innerHTML = `
      <div class="card-image-wrap">
        <img src="${imageSrc}" alt="${title}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
        <div class="card-image-fallback hidden">${lang === "ru" ? "Фото будет позже" : "Photo coming later"}</div>
      </div>

      <div class="card-body">
        <div class="card-topline">
          <h3 class="card-title">${title}</h3>
          <div class="card-category">${category}</div>
        </div>

        <div class="meta-row">
          <span class="chip">${getTimeLabel(p.time)}</span>
          <span class="chip">${getCostLabel(p.cost, p.price)}</span>
        </div>

        <p class="summary">${summary}</p>

        <div class="transit-row">
          <span>${lang === "ru" ? "Транспорт:" : "Transit:"}</span>
          <strong>${transit}</strong>
        </div>

        <div class="status-row">
          <button class="status-btn ${status === "want" ? "active" : ""}" onclick="setStatus('${p.id}', 'want')">${lang === "ru" ? "Хочу" : "Want"}</button>
          <button class="status-btn ${status === "visited" ? "active" : ""}" onclick="setStatus('${p.id}', 'visited')">${lang === "ru" ? "Был" : "Visited"}</button>
          <button class="status-btn ${status === "favorite" ? "active" : ""}" onclick="setStatus('${p.id}', 'favorite')">${lang === "ru" ? "Любимое" : "Favorite"}</button>
          <button class="status-btn ${status === "skip" ? "active" : ""}" onclick="setStatus('${p.id}', 'skip')">${lang === "ru" ? "Пропустить" : "Skip"}</button>
        </div>

        <div class="card-footer">
          <div class="status-label">${lang === "ru" ? "Текущий статус:" : "Current status:"} ${getStatusLabel(status)}</div>
          <div class="card-footer-actions">
            <button class="copy-btn" onclick="copyPlace('${p.id}')">${lang === "ru" ? "Копировать" : "Copy"}</button>
            <a class="primary-link-btn" href="${detailsUrl}">${lang === "ru" ? "Открыть" : "Open"}</a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(el);
  });

  if (typeof refreshMap === "function") {
    refreshMap(filtered);
  }
}

async function loadData() {
  const res = await fetch("build/places.json");
  places = await res.json();
  render();
  initMap(places);
}

function toggleMap() {
  const wrap = document.getElementById("mapWrap");
  wrap.classList.toggle("hidden");
  setTimeout(() => {
    if (window.map) {
      window.map.invalidateSize();
    }
  }, 50);
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
    if (status === "want") counts.want++;
    if (status === "visited") counts.visited++;
    if (status === "favorite") counts.favorite++;
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