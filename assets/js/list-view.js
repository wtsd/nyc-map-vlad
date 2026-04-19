(() => {
  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
  }

  function getStatusLabel(lang, status) { return NYCMapCommon.getStatusLabel(lang, status); }
  function getCategoryLabel(lang, category) { return NYCMapCommon.getCategoryLabel(lang, category); }
  function getTimeLabel(lang, time) { return NYCMapCommon.getTimeLabel(lang, time); }
  function getPersonalEmoji(personal) { return NYCMapCommon.getPersonalEmoji(personal); }
  function getCostLabel(lang, cost, price) { return NYCMapCommon.getCostLabel(lang, cost, price); }

  function updateStats(state, filtered) {
    const checklist = state.getChecklist();
    const counts = { total: filtered.length, want: 0, skip: 0, visited: 0 };

    filtered.forEach((p) => {
      const status = checklist[p.id];
      if (status === "want") counts.want += 1;
      if (status === "skip") counts.skip += 1;
      if (status === "visited") counts.visited += 1;
    });

    const total = document.getElementById("statTotal");
    const want = document.getElementById("statWant");
    const skip = document.getElementById("statSkip");
    const visited = document.getElementById("statVisited");

    if (total) total.textContent = counts.total;
    if (want) want.textContent = counts.want;
    if (skip) skip.textContent = counts.skip;
    if (visited) visited.textContent = counts.visited;
  }

  function renderPagination(state, totalItems, totalPages) {
    const paginations = [document.getElementById("paginationTop"), document.getElementById("pagination")].filter(Boolean);
    if (!paginations.length) return;

    if (totalItems <= state.pageSize) {
      paginations.forEach((pagination) => {
        pagination.innerHTML = "";
        pagination.classList.add("hidden");
      });
      return;
    }

    const currentPage = state.getCurrentPage();
    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";
    const html = `
      <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${prevDisabled} aria-label="Previous page">←</button>
      <span class="page-info">${currentPage} / ${totalPages}</span>
      <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${nextDisabled} aria-label="Next page">→</button>
    `;

    paginations.forEach((pagination) => {
      pagination.classList.remove("hidden");
      pagination.innerHTML = html;
    });
  }

  function applyMobileTabState(state) {
    const listSection = document.getElementById("listSection");
    const mapSection = document.getElementById("mapSection");
    const tabList = document.getElementById("tabList");
    const tabMap = document.getElementById("tabMap");
    const mobile = window.matchMedia("(max-width: 760px)").matches;

    if (!listSection || !mapSection || !tabList || !tabMap) return;

    if (!mobile) {
      listSection.classList.remove("mobile-hidden");
      mapSection.classList.remove("mobile-hidden");
    } else {
      const mobileView = state.getMobileView();
      listSection.classList.toggle("mobile-hidden", mobileView === "map");
      mapSection.classList.toggle("mobile-hidden", mobileView !== "map");
    }

    tabList.classList.toggle("active", state.getMobileView() === "list");
    tabMap.classList.toggle("active", state.getMobileView() === "map");
    tabList.setAttribute("aria-selected", String(state.getMobileView() === "list"));
    tabMap.setAttribute("aria-selected", String(state.getMobileView() === "map"));
  }

  function renderUIChrome(state) {
    const lang = state.getLang();
    const text = NYCMapUIText.getUIText(lang);

    const tabList = document.getElementById("tabList");
    const tabMap = document.getElementById("tabMap");
    const locateBtn = document.getElementById("locateBtn");
    const searchFilter = document.getElementById("searchFilter");
    const shareLabel = document.querySelector(".header-buttons button[onclick='copySummary()'] .btn-label");
    const langLabel = document.querySelector(".header-buttons button[onclick='toggleLang()'] .btn-label");

    if (tabList) tabList.textContent = text.listTab;
    if (tabMap) tabMap.textContent = text.mapTab;
    if (locateBtn) {
      locateBtn.setAttribute("aria-label", text.locateAria);
      const locateLabel = locateBtn.querySelector(".btn-label");
      if (locateLabel) locateLabel.textContent = text.locateMe;
    }
    if (searchFilter) searchFilter.placeholder = text.searchPlaceholder;
    if (shareLabel) shareLabel.textContent = text.share;
    if (langLabel) langLabel.textContent = text.language;

    const statusFilterTabs = document.querySelectorAll(".status-filter-tab");
    statusFilterTabs.forEach((tab) => {
      const statusKey = tab.dataset.status || "";
      const label = tab.querySelector(".stat-filter-label");
      const tabLabel = text.statusTabs[statusKey] || "";
      if (label) label.textContent = tabLabel;
      else tab.textContent = tabLabel || tab.textContent;

      const isActive = statusKey === state.getCurrentStatusFilter();
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    const statWantLabel = document.getElementById("statWantLabel");
    const statSkipLabel = document.getElementById("statSkipLabel");
    const statVisitedLabel = document.getElementById("statVisitedLabel");
    if (statWantLabel) statWantLabel.textContent = text.statLabels.want;
    if (statSkipLabel) statSkipLabel.textContent = text.statLabels.skip;
    if (statVisitedLabel) statVisitedLabel.textContent = text.statLabels.visited;

    const personalAllLabel = document.getElementById("personalAllLabel");
    const personalWantLabel = document.getElementById("personalWantLabel");
    const personalNotImpressedLabel = document.getElementById("personalNotImpressedLabel");
    const personalRecommendLabel = document.getElementById("personalRecommendLabel");
    if (personalAllLabel) personalAllLabel.textContent = text.personalTabs.all;
    if (personalWantLabel) personalWantLabel.textContent = text.personalTabs.wantToGo;
    if (personalNotImpressedLabel) personalNotImpressedLabel.textContent = text.personalTabs.notImpressed;
    if (personalRecommendLabel) personalRecommendLabel.textContent = text.personalTabs.recommend;

    const personalTabs = document.querySelectorAll(".personal-filter-tab");
    personalTabs.forEach((tab) => {
      const isActive = (tab.dataset.personal || "") === state.getCurrentPersonalFilter();
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
  }

  function renderCards(state, places) {
    const lang = state.getLang();
    const text = NYCMapUIText.getUIText(lang);
    const checklist = state.getChecklist();
    const container = document.getElementById("list");
    if (!container) return;

    container.innerHTML = "";
    const fragment = document.createDocumentFragment();
    places.forEach((p) => {
      const status = checklist[p.id] || "none";
      const title = NYCMapCommon.getLocalizedText(lang, p.title, "");
      const personalEmoji = getPersonalEmoji(p.personal);
      const fullTitle = personalEmoji ? `${personalEmoji} ${title}` : title;
      const summary = truncate(NYCMapCommon.getLocalizedText(lang, p.summary, ""), 180);
      const address = NYCMapCommon.getPlaceAddress(p, lang);
      const category = Array.isArray(p.category) && p.category.length ? getCategoryLabel(lang, p.category[0]) : "";
      const detailsUrl = NYCMapCommon.getPlaceDetailsUrl(p);
      const imageBlock = p.image
        ? `
        <a class="card-image-wrap card-image-link" href="${detailsUrl}" aria-label="${text.card.openDetails}">
          <img src="${p.image}" alt="${title}" loading="lazy" onerror="this.closest('.card-image-wrap')?.remove();">
        </a>
        `
        : "";

      const el = document.createElement("article");
      el.className = "card";
      el.id = `card-${p.id}`;
      el.dataset.placeId = p.id;
      el.innerHTML = `
        ${imageBlock}
        <div class="card-body">
          <div class="card-topline">
            <div class="card-title-wrap">
              <h3 class="card-title"><a class="card-title-link" href="${detailsUrl}">${fullTitle}</a></h3>
              <button class="copy-btn card-copy-btn" onclick="copyPlace('${p.id}')" aria-label="${text.card.copyDetails}" title="${text.card.copy}">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="11" height="11" rx="2"></rect>
                  <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>
                </svg>
                <span class="sr-only">${text.card.copy}</span>
              </button>
            </div>
            <div class="card-category">${category}</div>
          </div>
          <div class="transit-row">
            <a class="address-btn" href="${NYCMapCommon.getMapsUrl(p, lang)}" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">📍</span><span>${address}</span>
            </a>
          </div>
          <p class="summary">${summary}</p>
          <div class="meta-row">
            <span class="chip ${p.time === "short" ? "is-muted" : ""}">${getTimeLabel(lang, p.time)}</span>
            <span class="chip ${p.cost === "free" ? "is-muted" : ""}">${getCostLabel(lang, p.cost, p.price)}</span>
          </div>
          <div class="status-row"><div class="status-toggle-wrap">
            <button class="status-btn ${status === "want" ? "active" : ""} ${status !== "none" && status !== "want" ? "is-dimmed" : ""}" onclick="setStatus('${p.id}', 'want')">${text.card.statusWant}</button>
            <button class="status-btn ${status === "visited" ? "active" : ""} ${status !== "none" && status !== "visited" ? "is-dimmed" : ""}" onclick="setStatus('${p.id}', 'visited')">${text.card.statusVisited}</button>
            <button class="status-btn ${status === "skip" ? "active" : ""} ${status !== "none" && status !== "skip" ? "is-dimmed" : ""}" onclick="setStatus('${p.id}', 'skip')">${text.card.statusSkip}</button>
          </div></div>
        </div>`;
      el.addEventListener("click", (event) => {
        if (event.target.closest("button, a, input, select, textarea")) return;
        if (typeof focusMarkerFromCard === "function") focusMarkerFromCard(p.id, false);
      });
      fragment.appendChild(el);
    });
    container.appendChild(fragment);
  }

  async function copyPlace(state, id) {
    const p = state.getPlaces().find((x) => x.id === id);
    if (!p) return;

    const lang = state.getLang();
    const text = NYCMapUIText.getUIText(lang);
    const status = state.getChecklist()[id] || "none";

    const body = [
      NYCMapCommon.getLocalizedText(lang, p.title, ""),
      `${text.copy.status}: ${getStatusLabel(lang, status)}`,
      "",
      `${text.copy.address}: ${NYCMapCommon.getPlaceAddress(p, lang)}`,
      `${text.copy.time}: ${getTimeLabel(lang, p.time)}`,
      `${text.copy.cost}: ${getCostLabel(lang, p.cost, p.price)}`,
      "",
      p.summary[lang] || p.summary.en || ""
    ].join("\n");

    const copied = await NYCMapCommon.copyText(body);
    if (!copied) alert(text.copy.failed);
  }

  async function copySummary(state) {
    const lang = state.getLang();
    const labels = NYCMapUIText.getUIText(lang).summary;
    const grouped = { want: [], visited: [], skip: [] };

    state.getPlaces().forEach((p) => {
      const status = state.getChecklist()[p.id];
      if (status && grouped[status]) grouped[status].push(p.title[lang] || p.title.en);
    });

    let out = `${labels.title}\n\n`;
    ["want", "visited", "skip"].forEach((key) => {
      if (!grouped[key].length) return;
      out += `${labels[key]}:\n`;
      grouped[key].forEach((item) => { out += `- ${item}\n`; });
      out += "\n";
    });

    const copied = await NYCMapCommon.copyText(out.trim());
    if (!copied) alert(NYCMapUIText.getUIText(lang).copy.failed);
  }

  function render(state, filters) {
    const container = document.getElementById("list");
    if (!container) return;

    const filtered = filters.getFilteredPlaces(state);
    const statsSet = filters.getPlacesForStats(state);
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));

    if (state.getCurrentPage() > totalPages) state.setCurrentPage(totalPages);
    const pageStart = (state.getCurrentPage() - 1) * state.pageSize;
    const paginatedPlaces = filtered.slice(pageStart, pageStart + state.pageSize);

    updateStats(state, statsSet);
    renderUIChrome(state);
    renderCards(state, paginatedPlaces);

    if (typeof refreshMap === "function") refreshMap(filtered);
    renderPagination(state, filtered.length, totalPages);
    applyMobileTabState(state);
  }

  window.NYCMapListView = {
    render,
    copyPlace,
    copySummary,
    applyMobileTabState
  };
})();
