(() => {
  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function syncViewportOffsets() {
    const topbar = document.querySelector(".topbar");
    const footer = document.querySelector(".site-footer");
    const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
    const footerHeight = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
    document.documentElement.style.setProperty("--footer-height", `${footerHeight}px`);
  }

  function setFiltersPanelExpanded(expanded) {
    const controls = document.getElementById("secondaryControls");
    const toggle = document.getElementById("filtersToggle");
    const backdrop = document.getElementById("filtersBackdrop");
    if (!controls || !toggle) return;

    if (isMobile()) {
      controls.classList.toggle("is-open", expanded);
      backdrop?.classList.toggle("is-open", expanded);
      document.body.classList.toggle("filters-panel-open", expanded);
    } else {
      controls.classList.remove("is-open");
      backdrop?.classList.remove("is-open");
      document.body.classList.remove("filters-panel-open");
      controls.classList.toggle("is-collapsed", !expanded);
    }

    toggle.setAttribute("aria-expanded", String(expanded));
  }

  function toggleFiltersPanel() {
    const controls = document.getElementById("secondaryControls");
    if (!controls) return;
    const expanded = isMobile()
      ? !controls.classList.contains("is-open")
      : controls.classList.contains("is-collapsed");
    setFiltersPanelExpanded(expanded);
  }

  function switchMobileView(state, listView, view) {
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

  function setupViewportObservers() {
    const topbar = document.querySelector(".topbar");
    const footer = document.querySelector(".site-footer");
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => syncViewportOffsets());
    if (topbar) observer.observe(topbar);
    if (footer) observer.observe(footer);
  }

  window.NYCMapUIShell = {
    isMobile,
    syncViewportOffsets,
    setFiltersPanelExpanded,
    toggleFiltersPanel,
    switchMobileView,
    toggleMap,
    setupViewportObservers
  };
})();
