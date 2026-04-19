(() => {
  const state = window.NYCMapState;
  const filters = window.NYCMapFilters;
  const listView = window.NYCMapListView;
  const urlState = window.NYCMapUrlState;

  function render() {
    listView.render(state, filters);
  }

  function onFiltersChanged() {
    state.setCurrentPage(1);
    urlState.syncFiltersToUrl(state, filters);
    render();
  }

  function setStatus(id, status) {
    state.setChecklistStatus(id, status);
    render();
  }

  function setStatusFilter(status) {
    state.setCurrentStatusFilter(status);
    onFiltersChanged();
  }

  function setPersonalFilter(personal) {
    state.setCurrentPersonalFilter(personal);
    onFiltersChanged();
  }

  function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(filters.getFilteredPlaces(state).length / state.pageSize));
    state.setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    render();
  }

  function toggleLang() {
    state.toggleLang();
    render();
  }

  function renderListState(kind) {
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

  function setSecondaryControlsExpanded(expanded) {
    const controls = document.getElementById("secondaryControls");
    const toggle = document.getElementById("filtersToggle");
    if (!controls || !toggle) return;
    controls.classList.toggle("is-collapsed", !expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
  }

  function toggleFiltersPanel() {
    const controls = document.getElementById("secondaryControls");
    if (!controls) return;
    setSecondaryControlsExpanded(controls.classList.contains("is-collapsed"));
  }

  async function loadData() {
    renderListState("loading");
    try {
      const res = await fetch("build/places.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const places = await res.json();
      state.setPlaces(places);
      render();
      if (typeof initMap === "function") initMap(places);
    } catch (error) {
      console.error("Failed to load places.json", error);
      renderListState("error");
    }
  }

  function switchMobileView(view) {
    state.setMobileView(view);
    listView.applyMobileTabState(state);
  }

  function toggleMap() {
    const wrap = document.getElementById("mapWrap");
    if (!wrap) return;
    wrap.classList.toggle("hidden");
    setTimeout(() => {
      if (window.map) window.map.invalidateSize();
    }, 50);
  }

  window.toggleLang = toggleLang;
  window.copySummary = () => listView.copySummary(state);
  window.copyPlace = (id) => listView.copyPlace(state, id);
  window.setStatus = setStatus;
  window.onFiltersChanged = onFiltersChanged;
  window.setStatusFilter = setStatusFilter;
  window.setPersonalFilter = setPersonalFilter;
  window.goToPage = goToPage;
  window.switchMobileView = switchMobileView;
  window.toggleMap = toggleMap;
  window.toggleFiltersPanel = toggleFiltersPanel;

  loadData();
  urlState.applyFiltersFromUrl(state, filters);
  listView.applyMobileTabState(state);
  setSecondaryControlsExpanded(!window.matchMedia("(max-width: 760px)").matches);

  window.addEventListener("popstate", () => {
    urlState.applyFiltersFromUrl(state, filters);
    state.setCurrentPage(1);
    render();
  });

  window.addEventListener("resize", () => {
    listView.applyMobileTabState(state);
    setSecondaryControlsExpanded(!window.matchMedia("(max-width: 760px)").matches);
  });

  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
