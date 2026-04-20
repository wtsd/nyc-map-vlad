(() => {
  let activeTrap = null;

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function syncViewportOffsets() {
    const topbar = document.querySelector(".topbar");
    const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
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
      controls.setAttribute("aria-hidden", String(!expanded));
      trapFocusInFiltersSheet(expanded);
    } else {
      controls.classList.remove("is-open");
      backdrop?.classList.remove("is-open");
      document.body.classList.remove("filters-panel-open");
      controls.classList.toggle("is-collapsed", !expanded);
      controls.setAttribute("aria-hidden", "false");
      trapFocusInFiltersSheet(false);
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

  function closeFiltersPanel() {
    setFiltersPanelExpanded(false);
  }

  function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.hasAttribute("hidden") && el.offsetParent !== null);
  }

  function trapFocusInFiltersSheet(enabled) {
    const controls = document.getElementById("secondaryControls");
    if (!controls) return;

    if (!enabled) {
      if (activeTrap) {
        document.removeEventListener("keydown", activeTrap.handleKeydown);
        if (activeTrap.restoreFocusEl && typeof activeTrap.restoreFocusEl.focus === "function") {
          activeTrap.restoreFocusEl.focus();
        }
      }
      activeTrap = null;
      return;
    }

    const restoreFocusEl = document.activeElement;
    const focusables = getFocusableElements(controls);
    if (focusables.length) focusables[0].focus();

    function handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFiltersPanel();
        return;
      }

      if (event.key !== "Tab") return;
      const items = getFocusableElements(controls);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const isShift = event.shiftKey;
      const active = document.activeElement;

      if (!isShift && active === last) {
        event.preventDefault();
        first.focus();
      } else if (isShift && active === first) {
        event.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    activeTrap = { handleKeydown, restoreFocusEl };
  }

  function switchMobileView(state, listView, view) {
    const previousView = state.getMobileView();
    state.setMobileView(view);
    listView.applyMobileTabState(state);

    if (view === "map" && previousView !== "map" && typeof window.handleMapBecameVisible === "function") {
      window.handleMapBecameVisible();
    }
  }

  function toggleMap() {
    const wrap = document.getElementById("mapWrap");
    if (!wrap) return;

    const willShow = wrap.classList.contains("hidden");
    wrap.classList.toggle("hidden");

    if (willShow && typeof window.handleMapBecameVisible === "function") {
      window.handleMapBecameVisible();
      return;
    }

    setTimeout(() => {
      if (window.map) window.map.invalidateSize();
    }, 50);
  }

  function setupViewportObservers() {
    const topbar = document.querySelector(".topbar");
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => syncViewportOffsets());
    if (topbar) observer.observe(topbar);
  }

  window.NYCMapUIShell = {
    isMobile,
    syncViewportOffsets,
    setFiltersPanelExpanded,
    toggleFiltersPanel,
    closeFiltersPanel,
    switchMobileView,
    toggleMap,
    setupViewportObservers
  };
})();
