(() => {
  const VALID_PERSONAL = ["want-to-go", "highly-recommend"];
  const VALID_STATUS = ["", "want", "skip", "visited"];

  function readFilterInputs() {
    const categories = Array.from(document.querySelectorAll("#categoryFilterGroup input:checked")).map((input) => input.value);
    const search = (document.getElementById("searchFilter")?.value || "").trim().toLowerCase();
    return { categories, search };
  }

  function filterPlaces(places, checklist, getSearchText, { categories, search, status, personal }) {
    return places.filter((p) => {
      const categoryOk = !categories.length || (Array.isArray(p.category) && categories.some((category) => p.category.includes(category)));
      const statusOk = !status || checklist[p.id] === status;
      const personalOk = !personal.length || personal.includes(p.personal);
      if (!categoryOk || !statusOk || !personalOk) return false;
      if (!search) return true;
      return String(getSearchText(p.id)).includes(search);
    });
  }

  function getFilteredPlaces(state) {
    const { categories, search } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      categories,
      search,
      status: state.getCurrentStatusFilter(),
      personal: state.getCurrentPersonalFilter()
    });
  }

  function getPlacesForStats(state) {
    const { categories, search } = readFilterInputs();
    return filterPlaces(state.getPlaces(), state.getChecklist(), state.getSearchText, {
      categories,
      search,
      status: "",
      personal: []
    });
  }

  function applyFiltersFromParams(state, params) {
    const categories = (params.get("categories") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const personal = (params.get("personal") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const status = params.get("status") || "";
    const search = params.get("search") || "";

    const categoryInputs = Array.from(document.querySelectorAll("#categoryFilterGroup input"));
    categoryInputs.forEach((input) => {
      input.checked = categories.includes(input.value);
    });

    const validPersonal = personal.filter((value) => VALID_PERSONAL.includes(value));
    state.setCurrentPersonalFilter(validPersonal);
    const personalInputs = Array.from(document.querySelectorAll(".personal-toggle-chip input"));
    personalInputs.forEach((input) => {
      input.checked = validPersonal.includes(input.value);
    });
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
