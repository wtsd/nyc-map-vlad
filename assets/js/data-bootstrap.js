(() => {
  function renderListState(state, kind) {
    const list = document.getElementById("list");
    if (!list) return;
    const text = NYCMapUIText.getUIText(state.getLang());
    if (kind === "loading") {
      list.innerHTML = `<article class="empty-state-card is-loading"><h3>${text.loading.title}</h3><p>${text.loading.body}</p></article>`;
      return;
    }
    if (kind === "error") {
      list.innerHTML = `<article class="empty-state-card"><h3>${text.copy.loadFailed}</h3><p>${text.loading.body}</p></article>`;
    }
  }

  async function loadData(state) {
    renderListState(state, "loading");
    const manifest = await NYCMapDataLoader.loadManifest();
    const placesPath = NYCMapDataLoader.resolveAssetPath(manifest, "places", "build/places.json");
    const searchPath = NYCMapDataLoader.resolveAssetPath(manifest, "searchIndex", "build/search-index.json");

    const [placesRes, searchRes] = await Promise.all([
      fetch(placesPath),
      fetch(searchPath).catch(() => null)
    ]);

    if (!placesRes.ok) throw new Error(`HTTP ${placesRes.status}`);

    const places = await placesRes.json();
    state.setPlaces(places);

    if (searchRes && searchRes.ok) {
      state.setSearchIndex(await searchRes.json());
    } else {
      state.setSearchIndex([]);
    }

    return places;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((error) => {
        console.warn("Service worker registration failed", error);
      });
    });
  }

  window.NYCMapDataBootstrap = {
    loadData,
    renderListState,
    registerServiceWorker
  };
})();
