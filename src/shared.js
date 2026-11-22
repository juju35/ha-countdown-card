/**
 * Shared by the countdown cards (its names are used by the other src/ files): the events and their dates, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-countdown-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    unavailable: "Unavailable",
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    unavailable: "Indisponible",
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    unavailable: "Nicht verfügbar",
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    unavailable: "No disponible",
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    unavailable: "Недоступно",
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    unavailable: "Nedostupno",
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    unavailable: "Non disponibile",
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    unavailable: "Niet beschikbaar",
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    unavailable: "Indisponível",
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    unavailable: "Niedostępne",
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    unavailable: "Indisponibil",
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    unavailable: "Utilgængelig",
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    unavailable: "Ej tillgänglig",
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    unavailable: "Недостъпно",
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    unavailable: "Недоступно",
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    unavailable: "Недоступно",
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    unavailable: "Nem elérhető",
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    unavailable: "Ni na voljo",
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    unavailable: "Nav pieejams",
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    unavailable: "Μη διαθέσιμο",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Countdown ────────────────────────────────────────────────────────────────
// The events come from calendars (their events over the next `days_ahead` days), from entities (an `input_datetime`,
// a `timestamp` sensor, an Anniversaries sensor) and from the `events` list of the config. Each one is brought down to
// { name, date (local midnight), type, years, end, id }; a yearly one (a birthday, an anniversary, a date without a
// year) comes back every year. The type, when not given, is found in the name.
const CD_TYPES = ["birthday", "holiday", "trip", "anniversary", "event"];
const CD_WEDDING = /wedding|mariage|hochzeit|boda|matrimonio|bruiloft|ślub|casamento|свадьб|весілл|esküvő|svatb|svadb|poroka|kāzu|γάμου|nunt|bryllup|bröllop|сватб|venčanj|венчањ/i;
const CD_MATCH = {
  anniversary: /anniversary|jahrestag|aniversario|anniversario|jubileum|rocznica|годовщин|річниц|évforduló|výročí|obletnic|gadadien|επέτειο|aniversare|årsdag|годишнин|godišnjic|годишњиц/i,
  birthday:
    /birthday|\bb-?day\b|anniversaire|geburtstag|cumpleaños|compleanno|verjaardag|urodzin|aniversário|день рождения|день народження|születésnap|narozenin|narodenin|rojstn|dzimšanas|γενέθλια|ziua de naștere|fødselsdag|födelsedag|рожден ден|rođendan|рођендан/i,
  holiday: /holiday|vacances|vacation|congés|ferien|urlaub|vacaciones|vacanze|vakantie|wakacje|férias|отпуск|каникул|відпустк|канікул|szabadság|prázdnin|dovolen|počitnic|brīvdien|διακοπ|vacanț|ferie|semester|ваканц|празни|odmor|одмор/i,
  trip: /trip|voyage|travel|flight|\bvol\b|reise|viaje|viaggio|\breis\b|podróż|viagem|поездк|путешеств|подорож|utazás|výlet|potovan|ceļojum|ταξίδ|călători|rejse|\bresa\b|пътуван|putovanj|путовањ/i,
};

// The type of an event from its name: a wedding anniversary before a birthday ("anniversaire" is a birthday in French).
const cdType = (name, given) => {
  if (CD_TYPES.includes(given)) return given;
  const n = String(name || "");
  if (CD_WEDDING.test(n)) return "anniversary";
  return ["anniversary", "birthday", "holiday", "trip"].find((t) => CD_MATCH[t].test(n)) || "event";
};

// Local midnight of a date: "YYYY-MM-DD", "MM-DD" (no year), an ISO date-time or a Date.
const cdParse = (v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : { y: v.getFullYear(), m: v.getMonth(), d: v.getDate() };
  const s = String(v).trim();
  const md = /^(\d{1,2})-(\d{1,2})$/.exec(s);
  if (md) return { y: null, m: Number(md[1]) - 1, d: Number(md[2]) };
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) return { y: Number(ymd[1]), m: Number(ymd[2]) - 1, d: Number(ymd[3]) };
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};

const cdMidnight = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// The next occurrence of an event from `today` (local midnight, ms): { date, years } — the date itself when it is not
// yearly (null once past), else this year's or next year's, with the years since the first one when its year is known.
const cdNext = (p, yearly, today) => {
  if (!p) return null;
  const now = new Date(today);
  if (!yearly && p.y != null) {
    const t = new Date(p.y, p.m, p.d).getTime();
    return t >= today ? { date: t, years: null } : null;
  }
  let y = now.getFullYear();
  let t = new Date(y, p.m, p.d).getTime();
  if (t < today) t = new Date(++y, p.m, p.d).getTime();
  return { date: t, years: p.y != null && y > p.y ? y - p.y : null };
};

// Whole days from `today` to `date` (both local midnights): rounded, so that a daylight saving change never counts.
const cdDays = (date, today) => Math.round((date - today) / 86400000);

// An event from the config's `events` list.
const cdFromConfig = (e, today) => {
  const p = cdParse(e?.date);
  if (!p || !e.name) return null;
  const type = cdType(e.name, e.type);
  const yearly = e.yearly ?? (p.y == null || type === "birthday" || type === "anniversary");
  const n = cdNext(p, yearly, today);
  if (!n) return null;
  const end = e.end ? cdParse(e.end) : null;
  return { name: e.name, type, date: n.date, years: n.years, end: end && !yearly ? new Date(end.y, end.m, end.d).getTime() : null, id: null, icon: e.icon || null };
};

// An event from an entity: an Anniversaries sensor (its date and the years at the next one), an input_datetime with a
// date, a timestamp sensor.
const cdFromEntity = (hass, id, today) => {
  const st = hass.states[id];
  if (!st || ["unavailable", "unknown", ""].includes(st.state)) return null;
  const a = st.attributes || {};
  const name = a.friendly_name || id;
  if (hass.entities?.[id]?.platform === "anniversaries" || "years_at_next_anniversary" in a) {
    const first = cdParse(a.date);
    const next = cdParse(a.next_date);
    const type = cdType(name, a.is_birthday === false ? "anniversary" : null);
    const n = next ? { date: new Date(next.y ?? new Date(today).getFullYear(), next.m, next.d).getTime(), years: null } : cdNext(first, true, today);
    if (!n) return null;
    const years = Number(a.years_at_next_anniversary);
    return { name, type, date: n.date, years: Number.isFinite(years) && years > 0 ? years : n.years, end: null, id, icon: null };
  }
  if (id.startsWith("input_datetime.") && a.has_date === false) return null;
  const p = cdParse(st.state);
  if (!p) return null;
  const type = cdType(name);
  const n = cdNext(p, type === "birthday" || type === "anniversary", today);
  return n ? { name, type, date: n.date, years: n.years, end: null, id, icon: null } : null;
};

// The events of a calendar (the REST API's list): one per event, its end kept for the events of several days.
const cdFromCalendar = (id, list, today) =>
  (list || [])
    .map((ev) => {
      const s = cdParse(ev.start?.date || ev.start?.dateTime);
      if (!s) return null;
      const date = new Date(s.y, s.m, s.d).getTime();
      const e = cdParse(ev.end?.date || ev.end?.dateTime);
      // An all-day event's end is the day after its last day: one calendar day back (never 24 h, a day of 23 h on a
      // daylight saving change would end the day before).
      const end = e ? new Date(e.y, e.m, e.d - (ev.end?.date ? 1 : 0)).getTime() : null;
      // An event of several days that has started counts as today.
      const shown = date < today && end != null && end >= today ? today : date;
      return shown < today ? null : { name: ev.summary || "", type: cdType(ev.summary), date: shown, years: null, end: end && end > shown ? end : null, id, icon: null };
    })
    .filter(Boolean);

// The entities of the home that are events, for the card picker's first config: the Anniversaries sensors.
const cdSources = (hass) => Object.keys(hass.entities || {}).filter((id) => hass.entities[id].platform === "anniversaries");

// The Intl formats, made once per language and options (a render formats many dates).
const cdIntlCache = new Map();
const cdIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!cdIntlCache.has(key)) cdIntlCache.set(key, new Kind(lang, opts));
  return cdIntlCache.get(key);
};

// Strings of the countdown cards; the shared ones above (editor basics) complete them.
const CD_I18N = {
  en: {
    title: "Countdown",
    st_today: "Today",
    st_tomorrow: "Tomorrow",
    st_none: "Nothing soon",
    in_one: "In {n} day",
    in_many: "In {n} days",
    day_one: "{n} day",
    day_many: "{n} days",
    year_one: "{n} year",
    year_many: "{n} years",
    turns_one: "turns {n}",
    turns_many: "turns {n}",
    next: "Next: {name} on {date}",
    coming_up: "Coming up",
    nothing: "Nothing coming up",
    today_big: "Today!",
    ed_calendars: "Calendars",
    ed_calendars_helper: "Their events over the coming days",
    ed_entities: "Entities",
    ed_entities_helper: "Date helpers, timestamp sensors, Anniversaries sensors",
    ed_days_ahead: "Days ahead",
    ed_days_ahead_helper: "How far to look for events",
    ed_max_items: "Events shown",
    ed_max_items_helper: "The next one and those coming up",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_events: "Events (YAML)",
    ed_events_helper: "A list of { name, date, type, yearly, end }: date YYYY-MM-DD or MM-DD, type birthday, holiday, trip, anniversary or event",
    ed_title_helper: "Empty: Countdown",
  },
  fr: {
    title: "Compte à rebours",
    st_today: "Aujourd'hui",
    st_tomorrow: "Demain",
    st_none: "Rien de proche",
    in_one: "Dans {n} jour",
    in_many: "Dans {n} jours",
    day_one: "{n} jour",
    day_many: "{n} jours",
    year_one: "{n} an",
    year_many: "{n} ans",
    turns_one: "fête {n} an",
    turns_many: "fête ses {n} ans",
    next: "Prochain : {name} le {date}",
    coming_up: "À venir",
    nothing: "Rien à l'horizon",
    today_big: "Aujourd'hui !",
    ed_calendars: "Calendriers",
    ed_calendars_helper: "Leurs événements des prochains jours",
    ed_entities: "Entités",
    ed_entities_helper: "Entrées date, capteurs horodatage, capteurs Anniversaries",
    ed_days_ahead: "Jours à l'avance",
    ed_days_ahead_helper: "Jusqu'où chercher les événements",
    ed_max_items: "Événements affichés",
    ed_max_items_helper: "Le prochain et ceux à venir",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_events: "Événements (YAML)",
    ed_events_helper: "Une liste de { name, date, type, yearly, end } : date AAAA-MM-JJ ou MM-JJ, type birthday, holiday, trip, anniversary ou event",
    ed_title_helper: "Vide : Compte à rebours",
  },
  de: {
    title: "Countdown",
    st_today: "Heute",
    st_tomorrow: "Morgen",
    st_none: "Nichts in Sicht",
    in_one: "In {n} Tag",
    in_many: "In {n} Tagen",
    day_one: "{n} Tag",
    day_many: "{n} Tage",
    year_one: "{n} Jahr",
    year_many: "{n} Jahre",
    turns_one: "wird {n}",
    turns_many: "wird {n}",
    next: "Nächstes: {name} am {date}",
    coming_up: "Demnächst",
    nothing: "Nichts geplant",
    today_big: "Heute!",
    ed_calendars: "Kalender",
    ed_calendars_helper: "Ihre Termine der kommenden Tage",
    ed_entities: "Entitäten",
    ed_entities_helper: "Datumshelfer, Zeitstempel-Sensoren, Anniversaries-Sensoren",
    ed_days_ahead: "Tage im Voraus",
    ed_days_ahead_helper: "Wie weit nach Terminen gesucht wird",
    ed_max_items: "Angezeigte Termine",
    ed_max_items_helper: "Der nächste und die folgenden",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
    ed_events: "Termine (YAML)",
    ed_events_helper: "Eine Liste von { name, date, type, yearly, end }: Datum JJJJ-MM-TT oder MM-TT, Typ birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Leer: Countdown",
  },
  es: {
    title: "Cuenta atrás",
    st_today: "Hoy",
    st_tomorrow: "Mañana",
    st_none: "Nada próximo",
    in_one: "En {n} día",
    in_many: "En {n} días",
    day_one: "{n} día",
    day_many: "{n} días",
    year_one: "{n} año",
    year_many: "{n} años",
    turns_one: "cumple {n}",
    turns_many: "cumple {n}",
    next: "Próximo: {name} el {date}",
    coming_up: "Próximamente",
    nothing: "Nada a la vista",
    today_big: "¡Hoy!",
    ed_calendars: "Calendarios",
    ed_calendars_helper: "Sus eventos de los próximos días",
    ed_entities: "Entidades",
    ed_entities_helper: "Ayudantes de fecha, sensores de marca de tiempo, sensores Anniversaries",
    ed_days_ahead: "Días por delante",
    ed_days_ahead_helper: "Hasta dónde buscar eventos",
    ed_max_items: "Eventos mostrados",
    ed_max_items_helper: "El próximo y los siguientes",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
    ed_events: "Eventos (YAML)",
    ed_events_helper: "Una lista de { name, date, type, yearly, end }: fecha AAAA-MM-DD o MM-DD, tipo birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Vacío: Cuenta atrás",
  },
  sr: {
    title: "Одбројавање",
    st_today: "Данас",
    st_tomorrow: "Сутра",
    st_none: "Ништа ускоро",
    in_one: "За {n} дан",
    in_few: "За {n} дана",
    in_many: "За {n} дана",
    day_one: "{n} дан",
    day_few: "{n} дана",
    day_many: "{n} дана",
    year_one: "{n} година",
    year_few: "{n} године",
    year_many: "{n} година",
    turns_one: "пуни {n}",
    turns_many: "пуни {n}",
    next: "Следеће: {name}, {date}",
    coming_up: "Ускоро",
    nothing: "Ништа није планирано",
    today_big: "Данас!",
    ed_calendars: "Календари",
    ed_calendars_helper: "Њихови догађаји у наредним данима",
    ed_entities: "Ентитети",
    ed_entities_helper: "Помоћници датума, сензори временске ознаке, сензори Anniversaries",
    ed_days_ahead: "Дана унапред",
    ed_days_ahead_helper: "Докле тражити догађаје",
    ed_max_items: "Приказани догађаји",
    ed_max_items_helper: "Следећи и они који долазе",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
    ed_events: "Догађаји (YAML)",
    ed_events_helper: "Листа { name, date, type, yearly, end }: датум ГГГГ-ММ-ДД или ММ-ДД, тип birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Празно: Одбројавање",
  },
  "sr-Latn": {
    title: "Odbrojavanje",
    st_today: "Danas",
    st_tomorrow: "Sutra",
    st_none: "Ništa uskoro",
    in_one: "Za {n} dan",
    in_few: "Za {n} dana",
    in_many: "Za {n} dana",
    day_one: "{n} dan",
    day_few: "{n} dana",
    day_many: "{n} dana",
    year_one: "{n} godina",
    year_few: "{n} godine",
    year_many: "{n} godina",
    turns_one: "puni {n}",
    turns_many: "puni {n}",
    next: "Sledeće: {name}, {date}",
    coming_up: "Uskoro",
    nothing: "Ništa nije planirano",
    today_big: "Danas!",
    ed_calendars: "Kalendari",
    ed_calendars_helper: "Njihovi događaji u narednim danima",
    ed_entities: "Entiteti",
    ed_entities_helper: "Pomoćnici datuma, senzori vremenske oznake, senzori Anniversaries",
    ed_days_ahead: "Dana unapred",
    ed_days_ahead_helper: "Dokle tražiti događaje",
    ed_max_items: "Prikazani događaji",
    ed_max_items_helper: "Sledeći i oni koji dolaze",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
    ed_events: "Događaji (YAML)",
    ed_events_helper: "Lista { name, date, type, yearly, end }: datum GGGG-MM-DD ili MM-DD, tip birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Prazno: Odbrojavanje",
  },
  it: {
    title: "Conto alla rovescia",
    st_today: "Oggi",
    st_tomorrow: "Domani",
    st_none: "Niente in vista",
    in_one: "Tra {n} giorno",
    in_many: "Tra {n} giorni",
    day_one: "{n} giorno",
    day_many: "{n} giorni",
    year_one: "{n} anno",
    year_many: "{n} anni",
    turns_one: "compie {n} anno",
    turns_many: "compie {n} anni",
    next: "Prossimo: {name} il {date}",
    coming_up: "In arrivo",
    nothing: "Niente in programma",
    today_big: "Oggi!",
    ed_calendars: "Calendari",
    ed_calendars_helper: "I loro eventi dei prossimi giorni",
    ed_entities: "Entità",
    ed_entities_helper: "Helper data, sensori timestamp, sensori Anniversaries",
    ed_days_ahead: "Giorni in avanti",
    ed_days_ahead_helper: "Fin dove cercare gli eventi",
    ed_max_items: "Eventi mostrati",
    ed_max_items_helper: "Il prossimo e i successivi",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
    ed_events: "Eventi (YAML)",
    ed_events_helper: "Un elenco di { name, date, type, yearly, end }: data AAAA-MM-GG o MM-GG, tipo birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Vuoto: Conto alla rovescia",
  },
  nl: {
    title: "Aftellen",
    st_today: "Vandaag",
    st_tomorrow: "Morgen",
    st_none: "Niets binnenkort",
    in_one: "Over {n} dag",
    in_many: "Over {n} dagen",
    day_one: "{n} dag",
    day_many: "{n} dagen",
    year_one: "{n} jaar",
    year_many: "{n} jaar",
    turns_one: "wordt {n}",
    turns_many: "wordt {n}",
    next: "Volgende: {name} op {date}",
    coming_up: "Binnenkort",
    nothing: "Niets gepland",
    today_big: "Vandaag!",
    ed_calendars: "Agenda's",
    ed_calendars_helper: "Hun afspraken van de komende dagen",
    ed_entities: "Entiteiten",
    ed_entities_helper: "Datumhelpers, tijdstempelsensoren, Anniversaries-sensoren",
    ed_days_ahead: "Dagen vooruit",
    ed_days_ahead_helper: "Hoe ver naar gebeurtenissen gezocht wordt",
    ed_max_items: "Getoonde gebeurtenissen",
    ed_max_items_helper: "De volgende en de komende",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
    ed_events: "Gebeurtenissen (YAML)",
    ed_events_helper: "Een lijst van { name, date, type, yearly, end }: datum JJJJ-MM-DD of MM-DD, type birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Leeg: Aftellen",
  },
  pt: {
    title: "Contagem decrescente",
    st_today: "Hoje",
    st_tomorrow: "Amanhã",
    st_none: "Nada próximo",
    in_one: "Daqui a {n} dia",
    in_many: "Daqui a {n} dias",
    day_one: "{n} dia",
    day_many: "{n} dias",
    year_one: "{n} ano",
    year_many: "{n} anos",
    turns_one: "faz {n} ano",
    turns_many: "faz {n} anos",
    next: "Próximo: {name} a {date}",
    coming_up: "Em breve",
    nothing: "Nada à vista",
    today_big: "Hoje!",
    ed_calendars: "Calendários",
    ed_calendars_helper: "Os seus eventos dos próximos dias",
    ed_entities: "Entidades",
    ed_entities_helper: "Auxiliares de data, sensores de data/hora, sensores Anniversaries",
    ed_days_ahead: "Dias à frente",
    ed_days_ahead_helper: "Até onde procurar eventos",
    ed_max_items: "Eventos mostrados",
    ed_max_items_helper: "O próximo e os seguintes",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
    ed_events: "Eventos (YAML)",
    ed_events_helper: "Uma lista de { name, date, type, yearly, end }: data AAAA-MM-DD ou MM-DD, tipo birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Vazio: Contagem decrescente",
  },
  pl: {
    title: "Odliczanie",
    st_today: "Dziś",
    st_tomorrow: "Jutro",
    st_none: "Nic w najbliższym czasie",
    in_one: "Za {n} dzień",
    in_few: "Za {n} dni",
    in_many: "Za {n} dni",
    day_one: "{n} dzień",
    day_few: "{n} dni",
    day_many: "{n} dni",
    year_one: "{n} rok",
    year_few: "{n} lata",
    year_many: "{n} lat",
    turns_one: "kończy {n} rok",
    turns_few: "kończy {n} lata",
    turns_many: "kończy {n} lat",
    next: "Następne: {name}, {date}",
    coming_up: "Wkrótce",
    nothing: "Nic w planach",
    today_big: "Dziś!",
    ed_calendars: "Kalendarze",
    ed_calendars_helper: "Ich wydarzenia z najbliższych dni",
    ed_entities: "Encje",
    ed_entities_helper: "Pomocniki daty, czujniki znacznika czasu, czujniki Anniversaries",
    ed_days_ahead: "Dni do przodu",
    ed_days_ahead_helper: "Jak daleko szukać wydarzeń",
    ed_max_items: "Pokazane wydarzenia",
    ed_max_items_helper: "Najbliższe i kolejne",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
    ed_events: "Wydarzenia (YAML)",
    ed_events_helper: "Lista { name, date, type, yearly, end }: data RRRR-MM-DD lub MM-DD, typ birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Puste: Odliczanie",
  },
  ro: {
    title: "Numărătoare inversă",
    st_today: "Azi",
    st_tomorrow: "Mâine",
    st_none: "Nimic curând",
    in_one: "Peste {n} zi",
    in_few: "Peste {n} zile",
    in_many: "Peste {n} de zile",
    day_one: "{n} zi",
    day_few: "{n} zile",
    day_many: "{n} de zile",
    year_one: "{n} an",
    year_few: "{n} ani",
    year_many: "{n} de ani",
    turns_one: "împlinește {n} an",
    turns_few: "împlinește {n} ani",
    turns_many: "împlinește {n} de ani",
    next: "Următorul: {name} pe {date}",
    coming_up: "În curând",
    nothing: "Nimic planificat",
    today_big: "Azi!",
    ed_calendars: "Calendare",
    ed_calendars_helper: "Evenimentele lor din zilele următoare",
    ed_entities: "Entități",
    ed_entities_helper: "Ajutoare de dată, senzori marcaj de timp, senzori Anniversaries",
    ed_days_ahead: "Zile înainte",
    ed_days_ahead_helper: "Cât de departe se caută evenimentele",
    ed_max_items: "Evenimente afișate",
    ed_max_items_helper: "Următorul și cele ce urmează",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
    ed_events: "Evenimente (YAML)",
    ed_events_helper: "O listă de { name, date, type, yearly, end }: data AAAA-LL-ZZ sau LL-ZZ, tip birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Gol: Numărătoare inversă",
  },
  da: {
    title: "Nedtælling",
    st_today: "I dag",
    st_tomorrow: "I morgen",
    st_none: "Intet snart",
    in_one: "Om {n} dag",
    in_many: "Om {n} dage",
    day_one: "{n} dag",
    day_many: "{n} dage",
    year_one: "{n} år",
    year_many: "{n} år",
    turns_one: "fylder {n}",
    turns_many: "fylder {n}",
    next: "Næste: {name} {date}",
    coming_up: "Kommer snart",
    nothing: "Intet planlagt",
    today_big: "I dag!",
    ed_calendars: "Kalendere",
    ed_calendars_helper: "Deres begivenheder de kommende dage",
    ed_entities: "Enheder",
    ed_entities_helper: "Datohjælpere, tidsstempelsensorer, Anniversaries-sensorer",
    ed_days_ahead: "Dage frem",
    ed_days_ahead_helper: "Hvor langt der søges efter begivenheder",
    ed_max_items: "Viste begivenheder",
    ed_max_items_helper: "Den næste og de kommende",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
    ed_events: "Begivenheder (YAML)",
    ed_events_helper: "En liste af { name, date, type, yearly, end }: dato ÅÅÅÅ-MM-DD eller MM-DD, type birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Tom: Nedtælling",
  },
  sv: {
    title: "Nedräkning",
    st_today: "I dag",
    st_tomorrow: "I morgon",
    st_none: "Inget snart",
    in_one: "Om {n} dag",
    in_many: "Om {n} dagar",
    day_one: "{n} dag",
    day_many: "{n} dagar",
    year_one: "{n} år",
    year_many: "{n} år",
    turns_one: "fyller {n}",
    turns_many: "fyller {n}",
    next: "Nästa: {name} {date}",
    coming_up: "Kommande",
    nothing: "Inget planerat",
    today_big: "I dag!",
    ed_calendars: "Kalendrar",
    ed_calendars_helper: "Deras händelser de kommande dagarna",
    ed_entities: "Entiteter",
    ed_entities_helper: "Datumhjälpare, tidsstämpelsensorer, Anniversaries-sensorer",
    ed_days_ahead: "Dagar framåt",
    ed_days_ahead_helper: "Hur långt händelser söks",
    ed_max_items: "Visade händelser",
    ed_max_items_helper: "Nästa och de kommande",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
    ed_events: "Händelser (YAML)",
    ed_events_helper: "En lista med { name, date, type, yearly, end }: datum ÅÅÅÅ-MM-DD eller MM-DD, typ birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Tom: Nedräkning",
  },
  bg: {
    title: "Обратно броене",
    st_today: "Днес",
    st_tomorrow: "Утре",
    st_none: "Нищо скоро",
    in_one: "След {n} ден",
    in_many: "След {n} дни",
    day_one: "{n} ден",
    day_many: "{n} дни",
    year_one: "{n} година",
    year_many: "{n} години",
    turns_one: "навършва {n}",
    turns_many: "навършва {n}",
    next: "Следващо: {name} на {date}",
    coming_up: "Предстоящи",
    nothing: "Нищо не е планирано",
    today_big: "Днес!",
    ed_calendars: "Календари",
    ed_calendars_helper: "Техните събития през следващите дни",
    ed_entities: "Обекти",
    ed_entities_helper: "Помощници за дата, сензори за време, сензори Anniversaries",
    ed_days_ahead: "Дни напред",
    ed_days_ahead_helper: "Колко напред да се търсят събития",
    ed_max_items: "Показани събития",
    ed_max_items_helper: "Следващото и предстоящите",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
    ed_events: "Събития (YAML)",
    ed_events_helper: "Списък от { name, date, type, yearly, end }: дата ГГГГ-ММ-ДД или ММ-ДД, тип birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Празно: Обратно броене",
  },
  ru: {
    title: "Обратный отсчёт",
    st_today: "Сегодня",
    st_tomorrow: "Завтра",
    st_none: "Ничего в ближайшее время",
    in_one: "Через {n} день",
    in_few: "Через {n} дня",
    in_many: "Через {n} дней",
    day_one: "{n} день",
    day_few: "{n} дня",
    day_many: "{n} дней",
    year_one: "{n} год",
    year_few: "{n} года",
    year_many: "{n} лет",
    turns_one: "исполняется {n} год",
    turns_few: "исполняется {n} года",
    turns_many: "исполняется {n} лет",
    next: "Далее: {name}, {date}",
    coming_up: "Скоро",
    nothing: "Ничего не запланировано",
    today_big: "Сегодня!",
    ed_calendars: "Календари",
    ed_calendars_helper: "Их события на ближайшие дни",
    ed_entities: "Объекты",
    ed_entities_helper: "Помощники даты, датчики меток времени, датчики Anniversaries",
    ed_days_ahead: "Дней вперёд",
    ed_days_ahead_helper: "Как далеко искать события",
    ed_max_items: "Показанные события",
    ed_max_items_helper: "Ближайшее и следующие",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
    ed_events: "События (YAML)",
    ed_events_helper: "Список { name, date, type, yearly, end }: дата ГГГГ-ММ-ДД или ММ-ДД, тип birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Пусто: Обратный отсчёт",
  },
  uk: {
    title: "Зворотний відлік",
    st_today: "Сьогодні",
    st_tomorrow: "Завтра",
    st_none: "Нічого найближчим часом",
    in_one: "Через {n} день",
    in_few: "Через {n} дні",
    in_many: "Через {n} днів",
    day_one: "{n} день",
    day_few: "{n} дні",
    day_many: "{n} днів",
    year_one: "{n} рік",
    year_few: "{n} роки",
    year_many: "{n} років",
    turns_one: "виповнюється {n} рік",
    turns_few: "виповнюється {n} роки",
    turns_many: "виповнюється {n} років",
    next: "Далі: {name}, {date}",
    coming_up: "Незабаром",
    nothing: "Нічого не заплановано",
    today_big: "Сьогодні!",
    ed_calendars: "Календарі",
    ed_calendars_helper: "Їхні події на найближчі дні",
    ed_entities: "Об'єкти",
    ed_entities_helper: "Помічники дати, датчики міток часу, датчики Anniversaries",
    ed_days_ahead: "Днів наперед",
    ed_days_ahead_helper: "Як далеко шукати події",
    ed_max_items: "Показані події",
    ed_max_items_helper: "Найближча та наступні",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
    ed_events: "Події (YAML)",
    ed_events_helper: "Список { name, date, type, yearly, end }: дата РРРР-ММ-ДД або ММ-ДД, тип birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Порожньо: Зворотний відлік",
  },
  hu: {
    title: "Visszaszámlálás",
    st_today: "Ma",
    st_tomorrow: "Holnap",
    st_none: "Semmi a közeljövőben",
    in_one: "{n} nap múlva",
    in_many: "{n} nap múlva",
    day_one: "{n} nap",
    day_many: "{n} nap",
    year_one: "{n} év",
    year_many: "{n} év",
    turns_one: "{n} éves lesz",
    turns_many: "{n} éves lesz",
    next: "Következő: {name}, {date}",
    coming_up: "Hamarosan",
    nothing: "Nincs semmi tervezve",
    today_big: "Ma!",
    ed_calendars: "Naptárak",
    ed_calendars_helper: "Az eseményeik a következő napokban",
    ed_entities: "Entitások",
    ed_entities_helper: "Dátumsegédek, időbélyeg-érzékelők, Anniversaries-érzékelők",
    ed_days_ahead: "Napok előre",
    ed_days_ahead_helper: "Meddig keressen eseményeket",
    ed_max_items: "Megjelenített események",
    ed_max_items_helper: "A következő és az utána jövők",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
    ed_events: "Események (YAML)",
    ed_events_helper: "{ name, date, type, yearly, end } lista: dátum ÉÉÉÉ-HH-NN vagy HH-NN, típus birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Üres: Visszaszámlálás",
  },
  sk: {
    title: "Odpočítavanie",
    st_today: "Dnes",
    st_tomorrow: "Zajtra",
    st_none: "Nič v blízkej dobe",
    in_one: "O {n} deň",
    in_few: "O {n} dni",
    in_many: "O {n} dní",
    day_one: "{n} deň",
    day_few: "{n} dni",
    day_many: "{n} dní",
    year_one: "{n} rok",
    year_few: "{n} roky",
    year_many: "{n} rokov",
    turns_one: "oslavuje {n}",
    turns_many: "oslavuje {n}",
    next: "Ďalej: {name}, {date}",
    coming_up: "Čoskoro",
    nothing: "Nič naplánované",
    today_big: "Dnes!",
    ed_calendars: "Kalendáre",
    ed_calendars_helper: "Ich udalosti v najbližších dňoch",
    ed_entities: "Entity",
    ed_entities_helper: "Pomocníci dátumu, senzory časovej značky, senzory Anniversaries",
    ed_days_ahead: "Dní dopredu",
    ed_days_ahead_helper: "Ako ďaleko hľadať udalosti",
    ed_max_items: "Zobrazené udalosti",
    ed_max_items_helper: "Najbližšia a ďalšie",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
    ed_events: "Udalosti (YAML)",
    ed_events_helper: "Zoznam { name, date, type, yearly, end }: dátum RRRR-MM-DD alebo MM-DD, typ birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Prázdne: Odpočítavanie",
  },
  cs: {
    title: "Odpočet",
    st_today: "Dnes",
    st_tomorrow: "Zítra",
    st_none: "Nic v nejbližší době",
    in_one: "Za {n} den",
    in_few: "Za {n} dny",
    in_many: "Za {n} dní",
    day_one: "{n} den",
    day_few: "{n} dny",
    day_many: "{n} dní",
    year_one: "{n} rok",
    year_few: "{n} roky",
    year_many: "{n} let",
    turns_one: "slaví {n}",
    turns_many: "slaví {n}",
    next: "Další: {name}, {date}",
    coming_up: "Brzy",
    nothing: "Nic naplánováno",
    today_big: "Dnes!",
    ed_calendars: "Kalendáře",
    ed_calendars_helper: "Jejich události v příštích dnech",
    ed_entities: "Entity",
    ed_entities_helper: "Pomocníci data, senzory časové značky, senzory Anniversaries",
    ed_days_ahead: "Dní dopředu",
    ed_days_ahead_helper: "Jak daleko hledat události",
    ed_max_items: "Zobrazené události",
    ed_max_items_helper: "Nejbližší a další",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
    ed_events: "Události (YAML)",
    ed_events_helper: "Seznam { name, date, type, yearly, end }: datum RRRR-MM-DD nebo MM-DD, typ birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Prázdné: Odpočet",
  },
  sl: {
    title: "Odštevanje",
    st_today: "Danes",
    st_tomorrow: "Jutri",
    st_none: "Nič v kratkem",
    in_one: "Čez {n} dan",
    in_two: "Čez {n} dneva",
    in_few: "Čez {n} dni",
    in_many: "Čez {n} dni",
    day_one: "{n} dan",
    day_two: "{n} dneva",
    day_few: "{n} dnevi",
    day_many: "{n} dni",
    year_one: "{n} leto",
    year_two: "{n} leti",
    year_few: "{n} leta",
    year_many: "{n} let",
    turns_one: "praznuje {n}",
    turns_many: "praznuje {n}",
    next: "Naslednje: {name}, {date}",
    coming_up: "Kmalu",
    nothing: "Nič načrtovanega",
    today_big: "Danes!",
    ed_calendars: "Koledarji",
    ed_calendars_helper: "Njihovi dogodki v naslednjih dneh",
    ed_entities: "Entitete",
    ed_entities_helper: "Pomočniki datuma, senzorji časovnega žiga, senzorji Anniversaries",
    ed_days_ahead: "Dni vnaprej",
    ed_days_ahead_helper: "Kako daleč iskati dogodke",
    ed_max_items: "Prikazani dogodki",
    ed_max_items_helper: "Naslednji in prihajajoči",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
    ed_events: "Dogodki (YAML)",
    ed_events_helper: "Seznam { name, date, type, yearly, end }: datum LLLL-MM-DD ali MM-DD, vrsta birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Prazno: Odštevanje",
  },
  lv: {
    title: "Atpakaļskaitīšana",
    st_today: "Šodien",
    st_tomorrow: "Rīt",
    st_none: "Nekā tuvumā",
    in_one: "Pēc {n} dienas",
    in_many: "Pēc {n} dienām",
    day_one: "{n} diena",
    day_many: "{n} dienas",
    year_one: "{n} gads",
    year_many: "{n} gadi",
    turns_one: "paliek {n}",
    turns_many: "paliek {n}",
    next: "Nākamais: {name}, {date}",
    coming_up: "Drīzumā",
    nothing: "Nekas nav plānots",
    today_big: "Šodien!",
    ed_calendars: "Kalendāri",
    ed_calendars_helper: "To notikumi tuvākajās dienās",
    ed_entities: "Entītijas",
    ed_entities_helper: "Datuma palīgi, laika zīmoga sensori, Anniversaries sensori",
    ed_days_ahead: "Dienas uz priekšu",
    ed_days_ahead_helper: "Cik tālu meklēt notikumus",
    ed_max_items: "Rādītie notikumi",
    ed_max_items_helper: "Nākamais un sekojošie",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
    ed_events: "Notikumi (YAML)",
    ed_events_helper: "{ name, date, type, yearly, end } saraksts: datums GGGG-MM-DD vai MM-DD, tips birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Tukšs: Atpakaļskaitīšana",
  },
  el: {
    title: "Αντίστροφη μέτρηση",
    st_today: "Σήμερα",
    st_tomorrow: "Αύριο",
    st_none: "Τίποτα σύντομα",
    in_one: "Σε {n} ημέρα",
    in_many: "Σε {n} ημέρες",
    day_one: "{n} ημέρα",
    day_many: "{n} ημέρες",
    year_one: "{n} έτος",
    year_many: "{n} έτη",
    turns_one: "κλείνει τα {n}",
    turns_many: "κλείνει τα {n}",
    next: "Επόμενο: {name}, {date}",
    coming_up: "Προσεχώς",
    nothing: "Τίποτα προγραμματισμένο",
    today_big: "Σήμερα!",
    ed_calendars: "Ημερολόγια",
    ed_calendars_helper: "Τα γεγονότα τους των επόμενων ημερών",
    ed_entities: "Οντότητες",
    ed_entities_helper: "Βοηθοί ημερομηνίας, αισθητήρες χρονοσφραγίδας, αισθητήρες Anniversaries",
    ed_days_ahead: "Ημέρες μπροστά",
    ed_days_ahead_helper: "Πόσο μακριά να αναζητούνται γεγονότα",
    ed_max_items: "Γεγονότα που εμφανίζονται",
    ed_max_items_helper: "Το επόμενο και τα ακόλουθα",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
    ed_events: "Γεγονότα (YAML)",
    ed_events_helper: "Λίστα { name, date, type, yearly, end }: ημερομηνία ΕΕΕΕ-ΜΜ-ΗΗ ή ΜΜ-ΗΗ, τύπος birthday, holiday, trip, anniversary, event",
    ed_title_helper: "Κενό: Αντίστροφη μέτρηση",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `_zero`, `_two`, `_few` or `_many` (the "other" form), from the CLDR category
// of `n` in `lang` (Serbian 1 / 2-4 / 5+, 21 / 22…; Slovenian's dual 2, 102…; Latvian's zero 0, 10-20…). `_zero`, `_two`
// and `_few` are optional: without `_two` the dual takes `_few`; without `_few` or `_zero`, `_many` is used. A `_one`
// text without {n} ("Turn this plug off?") only means exactly one.
const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if ((cat === "two" || cat === "zero") && text(`${base}_${cat}`) != null) return `${base}_${cat}`;
  if ((cat === "few" || cat === "two") && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};


const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  // `<base>_one` / `_zero` / `_two` / `_few` / `_many` for `n`, with {n} filled in (with `vars.n`, a formatted number,
  // when given).
  _tn(base, n, vars) {
    return this._t(rcPluralKey(this.constructor.i18n, this._lang(), base, n), { n, ...vars });
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-countdown-card",
  });
};

if (!customElements.get("countdown-card")) {
  console.info(`%c HA-COUNTDOWN-CARD %c v${RC_VERSION} `, "background:#d6336c;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
