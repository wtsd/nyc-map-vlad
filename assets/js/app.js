let lang = localStorage.getItem("lang") || "en";
let places = [];
let checklist = {};

function toggleLang() {
  lang = lang === "en" ? "ru" : "en";
  localStorage.setItem("lang", lang);
  render();
}

function loadChecklist() {
  checklist = JSON.parse(localStorage.getItem("checklist") || "{}");
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
  return status || "none";
}

async function loadData() {
  const res = await fetch("build/places.json");
  places = await res.json();
  loadChecklist();
  render();
  initMap(places);
}

function render() {
  const container = document.getElementById("list");
  container.innerHTML = "";

  places.forEach(p => {
    const status = checklist[p.id] || "none";

    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <img src="${p.image}" loading="lazy"/>

      <div class="card-body">
        <h3>${p.title[lang]}</h3>

        <div class="meta">
          <span class="badge">${p.time}</span>
          <span class="badge">${p.cost}</span>
        </div>

        <p class="summary">${truncate(p.summary[lang], 120)}</p>

        <div class="transit">
          ${p.transit?.[lang] || ""}
        </div>

        <div class="actions">
          <button onclick="setStatus('${p.id}','want')">Want</button>
          <button onclick="setStatus('${p.id}','visited')">Visited</button>
          <button onclick="setStatus('${p.id}','favorite')">★</button>
        </div>

        <div class="status">Status: ${getStatusLabel(status)}</div>

        <div class="bottom">
          <button onclick="copyPlace('${p.id}')">Copy</button>
        </div>
      </div>
    `;

    container.appendChild(el);
  });
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function copyPlace(id) {
  const p = places.find(x => x.id === id);
  const status = checklist[id] || "none";

  const text = `${p.title[lang]}
Status: ${status}

Transit: ${p.transit?.[lang] || ""}
Time: ${p.time}
Cost: ${p.cost}

${p.summary[lang]}`;

  navigator.clipboard.writeText(text);
}

function applyFilters() {
  const cat = document.getElementById("categoryFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const container = document.getElementById("list");
  container.innerHTML = "";

  places
    .filter(p => !cat || p.category.includes(cat))
    .filter(p => !statusFilter || checklist[p.id] === statusFilter)
    .forEach(p => {
      const el = document.createElement("div");
      el.className = "card";
      el.innerHTML = `<h3>${p.title[lang]}</h3>`;
      container.appendChild(el);
    });
}

loadData();