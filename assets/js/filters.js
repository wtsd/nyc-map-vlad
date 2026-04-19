(() => {
  const VALID_PERSONAL = ["", "want-to-go", "been-not-impressed", "highly-recommend"];
  const VALID_STATUS = ["", "want", "skip", "visited"];

  function readFilterInputs() {
    const category = document.getElementById("categoryFilter")?.value || "";
    const search = (document.getElementById("searchFilter")?.value || "").trim().toLowerCase();
    return { category, search };
  }

  function filterPlaces(places, checklist, getSearchText, { category, search, status, personal }) {
    return places.filter((p) => {
      const categoryOk = !category || (Array.isArray(p.category) && p.category.includes(category));
      const statusOk = !status || checklist[p.id] === status;
      const personalOk = !personal || p.personal === personal;
      if (!categoryOk || !statusOk || !personalOk) return false;
      if (!search) return true;
      return String(getSearchText(p.id)).includes(search);
    });
  }

  function getFilteredPlaces(state) {
    const { category, search } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      category,
      search,
      status: state.getCurrentStatusFilter(),
      personal: state.getCurrentPersonalFilter()
    });
  }

  function getPlacesForStats(state) {
    const { category, search } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      category,
      search,
      status: "",
      personal: ""
    });
  }

  function applyFiltersFromParams(state, params) {
    const category = params.get("category") || "";
    const personal = params.get("personal") || "";
    const status = params.get("status") || "";
    const search = params.get("search") || "";

    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) {
      const validCategory = Array.from(categoryFilter.options).some((option) => option.value === category);
      categoryFilter.value = validCategory ? category : "";
    }

    state.setCurrentPersonalFilter(VALID_PERSONAL.includes(personal) ? personal : "");
    state.setCurrentStatusFilter(VALID_STATUS.includes(status) ? status : "");

    const searchFilter = document.getElementById("searchFilter");
    if (searchFilter) searchFilter.value = search;
  }

  window.NYCMapFilters = {
    readFilterInputs,
    filterPlaces,
    getFilteredPlaces,
    getPlacesForStats,
    applyFiltersFromParams
  };
})();
