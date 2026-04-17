let lang = localStorage.getItem("lang") || "en";
let places = [];

function toggleLang() {
  lang = lang === "en" ? "ru" : "en";
  localStorage.setItem("lang", lang);
  render();
}

async function loadData() {
  const res = await fetch("build/places.json");
  places = await res.json();
  render();
  initMap(places);
}

function render() {
  const container = document.getElementById("list");
  container.innerHTML = "";

  places.forEach(p => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <img src="${p.image}" />
      <h3>${p.title[lang]}</h3>
      <p>${p.summary[lang]}</p>
      <button onclick="toggleVisited('${p.id}')">✔</button>
      <button onclick="copyPlace('${p.id}')">Copy</button>
    `;

    container.appendChild(el);
  });
}

function copyPlace(id) {
  const p = places.find(x => x.id === id);
  const text = `${p.title[lang]}
Transit: ${p.transit[lang]}
Time: ${p.time}
Cost: ${p.cost}

${p.summary[lang]}`;

  navigator.clipboard.writeText(text);
}
loadData();
