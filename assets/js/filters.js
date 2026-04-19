(() => {
  const VALID_STATUS = ["", "want", "skip", "visited"];
  const VALID_PRICE = ["", "$", "$$", "$$$"];

  function readFilterInputs() {
    const category = document.getElementById("categoryFilter")?.value || "";
    const search = (document.getElementById("searchFilter")?.value || "").trim().toLowerCase();
    const visitedOnly = Boolean(document.getElementById("visitedFilter")?.checked);
    const price = document.getElementById("priceFilter")?.value || "";
    return { category, search, visitedOnly, price };
  }

  function filterPlaces(places, checklist, getSearchText, { category, search, status, visitedOnly, price }) {
    return places.filter((p) => {
      const categoryOk = !category || (Array.isArray(p.category) && p.category.includes(category));
      const statusOk = !status || checklist[p.id] === status;
      const visitedOk = !visitedOnly || checklist[p.id] === "visited";
      const priceOk = !price || NYCMapCommon.getPriceTier(p) === price;
      if (!categoryOk || !statusOk || !visitedOk || !priceOk) return false;
      if (!search) return true;
      return String(getSearchText(p.id)).includes(search);
    });
  }

  function getFilteredPlaces(state) {
    const { category, search, visitedOnly, price } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      category,
      search,
      status: state.getCurrentStatusFilter(),
      visitedOnly,
      price
    });
  }

  function getPlacesForStats(state) {
    const { category, search, visitedOnly, price } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      category,
      search,
      status: "",
      visitedOnly,
      price
    });
  }

  function applyFiltersFromParams(state, params) {
    const category = params.get("category") || "";
    const status = params.get("status") || "";
    const search = params.get("search") || "";
    const visited = params.get("visited") === "1";
    const price = params.get("price") || "";

    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) {
      const validCategory = Array.from(categoryFilter.options).some((option) => option.value === category);
      categoryFilter.value = validCategory ? category : "";
    }

    state.setCurrentStatusFilter(VALID_STATUS.includes(status) ? status : "");

    const searchFilter = document.getElementById("searchFilter");
    if (searchFilter) searchFilter.value = search;
    const visitedFilter = document.getElementById("visitedFilter");
    if (visitedFilter) visitedFilter.checked = visited;
    const priceFilter = document.getElementById("priceFilter");
    if (priceFilter) priceFilter.value = VALID_PRICE.includes(price) ? price : "";
  }

  window.NYCMapFilters = {
    readFilterInputs,
    filterPlaces,
    getFilteredPlaces,
    getPlacesForStats,
    applyFiltersFromParams
  };
})();
