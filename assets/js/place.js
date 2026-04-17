let lang = localStorage.getItem("lang") || "en";
let places = [];
let currentPlace = null;
let checklist = JSON.parse(localStorage.getItem("checklist") || "{}");

function getText() {
  return {
    en: {
      subtitle: "NYC Map by Vlad",
      back: "← Back",
      openMap: "Open map",
      copy: "Copy",
      transit: "Transit:",
      none: "Not set",
      want: "Want to visit",
      visited: "Visited",
      favorite: "Favorite",
      skip: "Skip",
      currentStatus: "Current status:",
      notFound: "Place not found",
      notFoundText: "The requested place does not exist.",
      photoFallback: "Photo coming later",
      wantBtn: "Want",
      visitedBtn: "Visited",
      favoriteBtn: "Favorite",
      skipBtn: "Skip",
      categories: {
        landmarks: "Landmark",
        parks: "Park",
        museums: "Museum",
        food: "Food",
        viewpoints: "Viewpoint",
        "hidden-gems": "Hidden gem",
        other: "Other"
      },
      times: {
        short: "Under 30 min",
        medium: "Couple of hours",
        full: "Whole day"
      },
      costs: {
        free: "Free",
        paid: "Paid"
      }
    },
    ru: {
      subtitle: "Карта Нью-Йорка от Влада",
      back: "← Назад",
      openMap: "Открыть карту",
      copy: "Копировать",
      transit: "Транспорт:",
      none: "Не выбрано",
      want: "Хочу посетить",
      visited: "Посетил",
      favorite: "Любимое",
      skip: "Пропустить",
      currentStatus: "Текущий статус:",
      notFound: "Место не найдено",
      notFoundText: "Запрошенное место не существует.",
      photoFallback: "Фото будет позже",
      wantBtn: "Хочу",
      visitedBtn: "Был",
      favoriteBtn: "Любимое",
      skipBtn: "Пропустить",
      categories: {
        landmarks: "Место",
        parks: "Парк",
        museums: "Музей",
        food: "Еда",
        viewpoints: "Вид",
        "hidden-gems": "Скрытое место",
        other: "Другое"
      },
      times: {
        short: "До 30 минут",
        medium: "Пара часов",
        full: "Весь день"
      },
      costs: {
        free: "Бесплатно",
        paid: "Платно"
      }
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
  const t = getText()[lang];
  return t[status || "none"];
}

function getTimeLabel(time) {
  const t = getText()[lang];
  return t.times[time] || time || "";
}

function getCostLabel(cost, price) {
  const t = getText()[lang];
  if (cost === "free") return t.costs.free;
  if (cost === "paid") {
    return price ? `${t.costs.paid} ${price}` : t.costs.paid;
  }
  return cost || "";
}

function getCategoryLabel(category) {
  const t = getText()[lang];
  return t.categories[category] || category || "";
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

  document.getElementById("placeStatus").textContent =
    `${t.currentStatus} ${getStatusLabel(status)}`;

  document.getElementById("btnWant").classList.toggle("active", status === "want");
  document.getElementById("btnVisited").classList.toggle("active", status === "visited");
  document.getElementById("btnFavorite").classList.toggle("active", status === "favorite");
  document.getElementById("btnSkip").classList.toggle("active", status === "skip");
}

function copyCurrentPlace() {
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

  navigator.clipboard.writeText(text);
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

  document.title = `${title} | NYC Map by Vlad`;
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
  document.getElementById("openMapLink").href = `index.html`;
  document.getElementById("openMapLink").textContent = t.openMap;
  document.getElementById("transitLabel").textContent = t.transit;

  document.getElementById("btnWant").textContent = t.wantBtn;
  document.getElementById("btnVisited").textContent = t.visitedBtn;
  document.getElementById("btnFavorite").textContent = t.favoriteBtn;
  document.getElementById("btnSkip").textContent = t.skipBtn;

  const backBtn = document.querySelector(".header-buttons a");
  if (backBtn) backBtn.textContent = t.back;

  const copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) copyBtn.textContent = t.copy;

  renderStatus();
}

async function loadData() {
  const res = await fetch("build/places.json");
  places = await res.json();
  render();
}

loadData();