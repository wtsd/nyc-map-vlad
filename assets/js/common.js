(() => {
  const DEFAULT_LANG = "en";

  const STATUS_LABELS = {
    none: { en: "Not set", ru: "Не выбрано" },
    want: { en: "Want to visit", ru: "Хочу посетить" },
    visited: { en: "Visited", ru: "Посетил" },
    skip: { en: "Skip", ru: "Пропустить" }
  };

  const CATEGORY_LABELS = {
    landmarks: { en: "Landmark", ru: "Место" },
    parks: { en: "Park", ru: "Парк" },
    museums: { en: "Museum", ru: "Музей" },
    food: { en: "Food", ru: "Еда" },
    viewpoints: { en: "Viewpoint", ru: "Вид" },
    "hidden-gems": { en: "Hidden gem", ru: "Скрытое место" },
    other: { en: "Other", ru: "Другое" }
  };

  const PERSONAL_LABELS = {
    "want-to-go": { en: "Want to go", ru: "Хочу сходить" },
    "highly-recommend": { en: "Highly recommend", ru: "Советую" },
    "highly-recommended": { en: "Highly recommend", ru: "Советую" }
  };

  const PERSONAL_EMOJIS = {
    "want-to-go": "🟦",
    "highly-recommend": "🟩",
    "highly-recommended": "🟩"
  };

  const TIME_LABELS = {
    short: { en: "Under 30 min", ru: "До 30 минут" },
    medium: { en: "Couple of hours", ru: "Пара часов" },
    full: { en: "Whole day", ru: "Весь день" }
  };

  const COST_LABELS = {
    free: { en: "Free", ru: "Бесплатно" },
    paid: { en: "Paid", ru: "Платно" }
  };

  function normalizeLang(lang) {
    return lang === "ru" ? "ru" : DEFAULT_LANG;
  }

  function getStatusLabel(lang, status) {
    const safeStatus = status || "none";
    return STATUS_LABELS[safeStatus]?.[normalizeLang(lang)] || safeStatus;
  }

  function getCategoryLabel(lang, category) {
    return CATEGORY_LABELS[category]?.[normalizeLang(lang)] || category || "";
  }

  function getTimeLabel(lang, time) {
    return TIME_LABELS[time]?.[normalizeLang(lang)] || time || "";
  }

  function getPersonalLabel(lang, personal) {
    return PERSONAL_LABELS[personal]?.[normalizeLang(lang)] || personal || "";
  }

  function getPersonalEmoji(personal) {
    return PERSONAL_EMOJIS[personal] || "";
  }

  function getCostLabel(lang, cost, price) {
    if (cost === "free") return COST_LABELS.free[normalizeLang(lang)];
    if (cost === "paid") {
      const base = COST_LABELS.paid[normalizeLang(lang)];
      return price ? `${base} ${price}` : base;
    }
    return cost || "";
  }

  function getLocalizedText(lang, value, fallback = "") {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value !== "object") return fallback;

    return value[normalizeLang(lang)] || value.en || fallback;
  }

  function getPlaceAddress(place, lang) {
    if (!place) return "";
    return getLocalizedText(lang, place.address, getLocalizedText(lang, place.title, place.id || ""));
  }

  function getMapsUrl(place, lang) {
    const query = getPlaceAddress(place, lang);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function getPrimaryCategory(place) {
    if (!place || !Array.isArray(place.category) || !place.category.length) return "";
    return String(place.category[0] || "").trim();
  }

  function getPlaceRoute(place) {
    if (!place) return "";
    if (place.route) return String(place.route);
    const category = getPrimaryCategory(place);
    const id = place.id ? String(place.id) : "";
    return category && id ? `${category}/${id}` : id;
  }

  function getPlaceDetailsUrl(place) {
    const route = getPlaceRoute(place);
    if (!route) return "place.html";
    return `place.html?place=${encodeURIComponent(route)}`;
  }

  function getPlaceQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const route = params.get("place") || "";
    const id = params.get("id") || "";
    return { route, id };
  }

  async function copyText(text) {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  window.NYCMapCommon = {
    normalizeLang,
    getStatusLabel,
    getCategoryLabel,
    getPersonalLabel,
    getPersonalEmoji,
    getTimeLabel,
    getCostLabel,
    getLocalizedText,
    getPlaceAddress,
    getMapsUrl,
    getPlaceRoute,
    getPlaceDetailsUrl,
    getPlaceQueryParams,
    copyText
  };
})();
