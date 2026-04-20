(() => {
  const TEXT = {
    en: {
      listTab: "List",
      mapTab: "Map",
      locateAria: "Show my location",
      locateMe: "Locate me",
      searchPlaceholder: "Search",
      copyToClipboard: "Copy to Clipboard",
      language: "Language",
      filters: "Filters",
      close: "Close",
      reset: "Reset",
      apply: "Apply",
      categoriesLabel: "categories",
      placesLabel: "places",
      allPlaces: "All places",
      statusTabs: { "": "All", want: "Want", skip: "Skip", visited: "Visited" },
      statLabels: { want: "Want", skip: "Skip", visited: "Visited" },
      personalTabs: {
        all: "All",
        wantToGo: "Want",
        recommend: "Top"
      },
      card: {
        openDetails: "Open place details",
        copyDetails: "Copy place details",
        copy: "Copy",
        personalLabel: "Personal label",
        personalVisited: "Visited",
        personalTodo: "Want to visit",
        userFilterLabel: "Your filter",
        statusWant: "Want",
        statusVisited: "Visited",
        statusSkip: "Skip",
        emptyTitle: "No places found",
        emptyBody: "Try clearing filters or changing search keywords."
      },
      copy: {
        status: "Status",
        address: "Address",
        time: "Time",
        cost: "Cost",
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
      copyToClipboard: "Скопировать",
      language: "Язык",
      filters: "Фильтры",
      close: "Закрыть",
      reset: "Сбросить",
      apply: "Применить",
      categoriesLabel: "категории",
      placesLabel: "мест",
      allPlaces: "Все места",
      statusTabs: { "": "Все", want: "Хочу", skip: "Пропустить", visited: "Был" },
      statLabels: { want: "Хочу", skip: "Пропустить", visited: "Был" },
      personalTabs: {
        all: "Все",
        wantToGo: "Хочу сходить",
        recommend: "Советую"
      },
      card: {
        openDetails: "Открыть карточку места",
        copyDetails: "Скопировать карточку",
        copy: "Копировать",
        personalLabel: "Личная отметка",
        personalVisited: "Посетили",
        personalTodo: "Хочу посетить",
        userFilterLabel: "Ваш фильтр",
        statusWant: "Хочу",
        statusVisited: "Был",
        statusSkip: "Пропустить",
        emptyTitle: "Ничего не найдено",
        emptyBody: "Попробуйте сбросить фильтры или изменить запрос."
      },
      copy: {
        status: "Статус",
        address: "Адрес",
        time: "Время",
        cost: "Цена",
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
