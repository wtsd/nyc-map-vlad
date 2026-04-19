(() => {
  const TEXT = {
    en: {
      listTab: "List",
      mapTab: "Map",
      locateAria: "Show my location",
      locateMe: "Locate me",
      searchPlaceholder: "Search",
      share: "Share",
      language: "Language",
      filters: "Filters",
      statusTabs: { "": "All", want: "Want", skip: "Skip", visited: "Visited" },
      statLabels: { want: "Want", skip: "Skip", visited: "Visited" },
      card: {
        openDetails: "Open place details",
        copyDetails: "Copy place details",
        copy: "Copy",
        statusVisited: "Visited",
        price: "Price",
        emptyTitle: "No places found",
        emptyBody: "Try clearing filters or changing search keywords."
      },
      copy: {
        status: "Status",
        address: "Address",
        price: "Price",
        failed: "Could not copy to clipboard",
        loadFailed: "Failed to load data"
      },
      loading: {
        title: "Loading places...",
        body: "Preparing the list and map."
      },
      summary: {
        title: "NYC Map by Vlad and Katya",
        want: "Want to visit",
        visited: "Visited",
        skip: "Skip"
      }
    },
    ru: {
      listTab: "Список",
      mapTab: "Карта",
      locateAria: "Показать мое местоположение",
      locateMe: "Где я",
      searchPlaceholder: "Поиск",
      share: "Поделиться",
      language: "Язык",
      filters: "Фильтры",
      statusTabs: { "": "Все", want: "Хочу", skip: "Пропустить", visited: "Был" },
      statLabels: { want: "Хочу", skip: "Пропустить", visited: "Был" },
      card: {
        openDetails: "Открыть карточку места",
        copyDetails: "Скопировать карточку",
        copy: "Копировать",
        statusVisited: "Был",
        price: "Цена",
        emptyTitle: "Ничего не найдено",
        emptyBody: "Попробуйте сбросить фильтры или изменить запрос."
      },
      copy: {
        status: "Статус",
        address: "Адрес",
        price: "Цена",
        failed: "Не удалось скопировать",
        loadFailed: "Ошибка загрузки"
      },
      loading: {
        title: "Загружаем места...",
        body: "Готовим список и карту."
      },
      summary: {
        title: "Карта Нью-Йорка от Влада и Кати",
        want: "Хочу посетить",
        visited: "Посетил",
        skip: "Пропустить"
      }
    }
  };

  function getUIText(lang) {
    return TEXT[NYCMapCommon.normalizeLang(lang)] || TEXT.en;
  }

  window.NYCMapUIText = { getUIText };
})();
