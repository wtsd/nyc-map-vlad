(() => {
  function syncFiltersToUrl(state, filters) {
    const url = new URL(window.location.href);
    const { categories } = filters.readFilterInputs();
    const search = (document.getElementById("searchFilter")?.value || "").trim();

    if (categories.length) url.searchParams.set("categories", categories.join(","));
    else url.searchParams.delete("categories");

    if (state.getCurrentPersonalFilter().length) url.searchParams.set("personal", state.getCurrentPersonalFilter().join(","));
    else url.searchParams.delete("personal");

    if (state.getCurrentStatusFilter()) url.searchParams.set("status", state.getCurrentStatusFilter());
    else url.searchParams.delete("status");

    if (search) url.searchParams.set("search", search);
    else url.searchParams.delete("search");

    window.history.pushState({}, "", url);
  }

  function applyFiltersFromUrl(state, filters) {
    const params = new URLSearchParams(window.location.search);
    filters.applyFiltersFromParams(state, params);
  }

  window.NYCMapUrlState = {
    syncFiltersToUrl,
    applyFiltersFromUrl
  };
})();
