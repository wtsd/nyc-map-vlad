(() => {
  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
  }

  function getStatusLabel(lang, status) { return NYCMapCommon.getStatusLabel(lang, status); }
  function getCategoryLabel(lang, category) { return NYCMapCommon.getCategoryLabel(lang, category); }
  function getTimeLabel(lang, time) { return NYCMapCommon.getTimeLabel(lang, time); }
  function getCostLabel(lang, cost, price) { return NYCMapCommon.getCostLabel(lang, cost, price); }
  function getPersonalLabel(text, personal) {
    return personal === "visited" ? text.card.personalVisited : text.card.personalTodo;
  }

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
    const filtersLabel = document.querySelector("#filtersToggle .btn-label");

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
    if (filtersLabel) filtersLabel.textContent = text.filters;

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

    const personalInputs = document.querySelectorAll(".personal-toggle-chip input");
    const selectedPersonal = state.getCurrentPersonalFilter();
    personalInputs.forEach((input) => {
      input.checked = selectedPersonal.includes(input.value);
      input.parentElement?.classList.toggle("active", input.checked);
    });
  }

  function renderCards(state, places) {
    const lang = state.getLang();
    const text = NYCMapUIText.getUIText(lang);
    const checklist = state.getChecklist();
    const container = document.getElementById("list");
    if (!container) return;

    container.innerHTML = "";
    if (!places.length) {
      container.innerHTML = `
        <article class="empty-state-card">
          <h3>${text.card.emptyTitle}</h3>
          <p>${text.card.emptyBody}</p>
        </article>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    places.forEach((p) => {
      const status = checklist[p.id] || "none";
      const title = NYCMapCommon.getLocalizedText(lang, p.title, "");
      const summary = truncate(NYCMapCommon.getLocalizedText(lang, p.summary, ""), 180);
      const address = NYCMapCommon.getPlaceAddress(p, lang);
      const category = Array.isArray(p.category) && p.category.length ? getCategoryLabel(lang, p.category[0]) : "";
      const detailsUrl = NYCMapCommon.getPlaceDetailsUrl(p);
      const numericPrice = Number(p.price);
      const priceTier = Number.isFinite(numericPrice) && numericPrice > 0
        ? Math.max(1, Math.min(3, numericPrice))
        : 0;
      const priceLabel = priceTier ? "$".repeat(priceTier) : "";
      const imageUrl = p.thumbnail || p.image;
      const normalizedPersonal = p.personal === "visited" ? "visited" : "to-do";
      const personalIcon = normalizedPersonal === "visited" ? "✅" : "❔";
      const imageBlock = imageUrl
        ? `
        <a class="card-image-wrap card-image-link" href="${detailsUrl}" aria-label="${text.card.openDetails}">
          <picture>
            ${p.thumbnail ? `<source srcset="${p.thumbnail}" type="image/webp">` : ""}
            <img src="${p.image || imageUrl}" alt="${title}" loading="lazy" width="640" height="360" decoding="async" onerror="this.closest('.card-image-wrap')?.remove();">
          </picture>
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
            <h3 class="card-title"><a class="card-title-link" href="${detailsUrl}">${title}</a></h3>
            <div class="card-topline-meta">
              ${priceLabel ? `<span class="chip">${priceLabel}</span>` : ""}
              <button class="copy-btn card-copy-btn" onclick="copyPlace('${p.id}')" aria-label="${text.card.copyDetails}" title="${text.card.copy}">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="11" height="11" rx="2"></rect>
                  <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path>
                </svg>
                <span class="sr-only">${text.card.copy}</span>
              </button>
              <span class="chip personal-rating-chip" title="${text.card.personalLabel}: ${getPersonalLabel(text, normalizedPersonal)}">${personalIcon}</span>
              <span class="card-category">${category}</span>
            </div>
          </div>
          <div class="transit-row">
            <a class="address-btn" href="${NYCMapCommon.getMapsUrl(p, lang)}" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">📍</span><span>${address}</span>
            </a>
          </div>
          <p class="summary">${summary}</p>
          <div class="status-row">
            <div class="card-status-actions" role="group" aria-label="User status">
              <button type="button" class="status-chip-btn ${status === "want" ? "active" : ""}" onclick="setStatus('${p.id}', 'want')">${text.card.statusWant}</button>
              <button type="button" class="status-chip-btn ${status === "skip" ? "active" : ""}" onclick="setStatus('${p.id}', 'skip')">${text.card.statusSkip}</button>
              <button type="button" class="status-chip-btn ${status === "visited" ? "active" : ""}" onclick="setStatus('${p.id}', 'visited')">${text.card.statusVisited}</button>
            </div>
          </div>
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



  let lastMapRenderKey = "";

  function getMapRenderKey(state, filteredPlaces) {
    const lang = state.getLang();
    const category = Array.from(document.querySelectorAll("#categoryFilterGroup input:checked")).map((input) => input.value).join(",");
    const ids = filteredPlaces.map((place) => place.id).join("|");
    return `${lang}::${category}::${ids}`;
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

    if (typeof refreshMap === "function") {
      const mapRenderKey = getMapRenderKey(state, filtered);
      if (mapRenderKey !== lastMapRenderKey) {
        const isMobile = window.matchMedia("(max-width: 760px)").matches;
        const shouldFitBounds = !isMobile || state.getMobileView() === "map";
        refreshMap(filtered, { shouldFitBounds });
        lastMapRenderKey = mapRenderKey;
      }
    }
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
