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
      statusTabs: { "": "All", want: "Want", skip: "Skip", visited: "Visited" },
      statLabels: { want: "Want", skip: "Skip", visited: "Visited" },
      personalTabs: {
        all: "Personal: all",
        wantToGo: "Want to go",
        notImpressed: "Not impressed",
        recommend: "Highly recommend"
      },
      card: {
        openDetails: "Open place details",
        copyDetails: "Copy place details",
        copy: "Copy",
        statusWant: "Want",
        statusVisited: "Visited",
        statusSkip: "Skip"
      },
      copy: {
        status: "Status",
        address: "Address",
        time: "Time",
        cost: "Cost",
        failed: "Could not copy to clipboard",
        loadFailed: "Failed to load data"
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
      statusTabs: { "": "Все", want: "Хочу", skip: "Пропустить", visited: "Был" },
      statLabels: { want: "Хочу", skip: "Пропустить", visited: "Был" },
      personalTabs: {
        all: "Личное: все",
        wantToGo: "Хочу сходить",
        notImpressed: "Не впечатлило",
        recommend: "Советую"
      },
      card: {
        openDetails: "Открыть карточку места",
        copyDetails: "Скопировать карточку",
        copy: "Копировать",
        statusWant: "Хочу",
        statusVisited: "Был",
        statusSkip: "Пропустить"
      },
      copy: {
        status: "Статус",
        address: "Адрес",
        time: "Время",
        cost: "Цена",
        failed: "Не удалось скопировать",
        loadFailed: "Ошибка загрузки"
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
