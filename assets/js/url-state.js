(() => {
  function syncFiltersToUrl(state, filters) {
    const url = new URL(window.location.href);
    const { category, visitedOnly, price } = filters.readFilterInputs();
    const search = (document.getElementById("searchFilter")?.value || "").trim();

    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");

    if (state.getCurrentStatusFilter()) url.searchParams.set("status", state.getCurrentStatusFilter());
    else url.searchParams.delete("status");

    if (visitedOnly) url.searchParams.set("visited", "1");
    else url.searchParams.delete("visited");

    if (price) url.searchParams.set("price", price);
    else url.searchParams.delete("price");

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
