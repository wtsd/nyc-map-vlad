(() => {
  const pageSize = 25;

  const state = {
    lang: NYCMapCommon.normalizeLang(localStorage.getItem("lang")),
    places: [],
    checklist: JSON.parse(localStorage.getItem("checklist") || "{}"),
    mobileView: "list",
    currentPage: 1,
    currentStatusFilter: "",
    searchIndexById: {}
  };

  Object.keys(state.checklist).forEach((id) => {
    if (state.checklist[id] === "favorite") state.checklist[id] = null;
  });

  function getState() {
    return state;
  }

  function getLang() {
    return state.lang;
  }

  function setLang(lang) {
    state.lang = NYCMapCommon.normalizeLang(lang);
    localStorage.setItem("lang", state.lang);
  }

  function toggleLang() {
    setLang(state.lang === "en" ? "ru" : "en");
  }

  function getPlaces() {
    return state.places;
  }

  function setPlaces(places) {
    state.places = Array.isArray(places) ? places : [];
  }

  function setSearchIndex(indexRows) {
    if (!Array.isArray(indexRows)) {
      state.searchIndexById = {};
      return;
    }

    state.searchIndexById = indexRows.reduce((acc, row) => {
      if (!row || typeof row.id !== "string") return acc;
      acc[row.id] = typeof row.text === "string" ? row.text : "";
      return acc;
    }, {});
  }

  function getSearchText(placeId) {
    return state.searchIndexById[placeId] || "";
  }

  function getChecklist() {
    return state.checklist;
  }

  function setChecklistStatus(id, status) {
    state.checklist[id] = state.checklist[id] === status ? null : status;
    localStorage.setItem("checklist", JSON.stringify(state.checklist));
  }

  function setCurrentPage(page) {
    state.currentPage = page;
  }

  function getCurrentPage() {
    return state.currentPage;
  }

  function setCurrentStatusFilter(status) {
    state.currentStatusFilter = status || "";
  }

  function getCurrentStatusFilter() {
    return state.currentStatusFilter;
  }

  function setMobileView(view) {
    state.mobileView = view === "map" ? "map" : "list";
  }

  function getMobileView() {
    return state.mobileView;
  }

  window.NYCMapState = {
    getState,
    getLang,
    setLang,
    toggleLang,
    getPlaces,
    setPlaces,
    setSearchIndex,
    getSearchText,
    getChecklist,
    setChecklistStatus,
    setCurrentPage,
    getCurrentPage,
    setCurrentStatusFilter,
    getCurrentStatusFilter,
    setMobileView,
    getMobileView,
    pageSize
  };
})();
