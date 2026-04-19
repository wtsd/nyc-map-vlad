(() => {
  const state = window.NYCMapState;
  const filters = window.NYCMapFilters;
  const listView = window.NYCMapListView;
  const urlState = window.NYCMapUrlState;
  const uiShell = window.NYCMapUIShell;
  const dataBootstrap = window.NYCMapDataBootstrap;

  function render() {
    listView.render(state, filters);
  }

  function onFiltersChanged() {
    state.setCurrentPage(1);
    urlState.syncFiltersToUrl(state, filters);
    render();
  }

  function setStatus(id, status) {
    const nextStatus = state.getChecklist()[id] === status ? null : status;
    state.setChecklistStatus(id, nextStatus);
    render();
  }

  function setStatusFilter(status) {
    state.setCurrentStatusFilter(status);
    onFiltersChanged();
  }

  function onPersonalToggleChanged() {
    const selected = Array.from(document.querySelectorAll(".personal-toggle-chip input:checked")).map((input) => input.value);
    state.setCurrentPersonalFilter(selected);
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

  function setupGlobalActions() {
    window.toggleLang = toggleLang;
    window.copySummary = () => listView.copySummary(state);
    window.copyPlace = (id) => listView.copyPlace(state, id);
    window.setStatus = setStatus;
    window.onFiltersChanged = onFiltersChanged;
    window.setStatusFilter = setStatusFilter;
    window.onPersonalToggleChanged = onPersonalToggleChanged;
    window.goToPage = goToPage;
    window.switchMobileView = (view) => uiShell.switchMobileView(state, listView, view);
    window.toggleMap = uiShell.toggleMap;
    window.toggleFiltersPanel = uiShell.toggleFiltersPanel;
  }

  function setupEventListeners() {
    window.addEventListener("popstate", () => {
      urlState.applyFiltersFromUrl(state, filters);
      state.setCurrentPage(1);
      render();
    });

    window.addEventListener("resize", () => {
      listView.applyMobileTabState(state);
      uiShell.setFiltersPanelExpanded(!uiShell.isMobile());
      uiShell.syncViewportOffsets();
    });
  }

  async function boot() {
    setupGlobalActions();
    setupEventListeners();
    uiShell.setupViewportObservers();
    dataBootstrap.registerServiceWorker();

    urlState.applyFiltersFromUrl(state, filters);
    listView.applyMobileTabState(state);
    uiShell.setFiltersPanelExpanded(!uiShell.isMobile());
    uiShell.syncViewportOffsets();

    const yearEl = document.getElementById("footerYear");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    try {
      const places = await dataBootstrap.loadData(state);
      render();
      if (typeof initMap === "function") initMap(places);
    } catch (error) {
      console.error("Failed to load places data", error);
      dataBootstrap.renderListState(state, "error");
    }
  }

  boot();
})();
