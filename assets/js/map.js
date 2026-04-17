let map;
let markers = {};

function initMap(places) {
  map = L.map('map').setView([40.7128, -74.0060], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  places.forEach(p => {
    const marker = L.marker(p.coords).addTo(map);

    marker.on('click', () => {
      scrollToCard(p.id);
    });

    markers[p.id] = marker;
  });
}

function scrollToCard(id) {
  const cards = document.querySelectorAll(".card");
  cards.forEach(c => {
    if (c.innerHTML.includes(id)) {
      c.scrollIntoView({ behavior: "smooth", block: "center" });
      c.style.border = "2px solid black";
      setTimeout(() => (c.style.border = ""), 1500);
    }
  });
}