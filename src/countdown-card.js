/**
 * countdown-card / countdown-mini-card: the days left until birthdays, holidays, trips and anniversaries. The next one in
 * big with its picture, the age reached or the years, its date, then those coming up.
 * https://github.com/juju35/ha-countdown-card
 */

// The calendars are asked for their events over this many days at most (`days_ahead` beyond it still counts for the
// entities and the `events` list).
const CD_FETCH_DAYS = 400;
// Colour and icon of each type of event.
const CD_COLORS = { birthday: "#d6336c", holiday: "#1c7ed6", trip: "#0c8599", anniversary: "#7048e8", event: "#e67700" };
const CD_ICONS = { birthday: "mdi:cake-variant", holiday: "mdi:beach", trip: "mdi:airplane", anniversary: "mdi:gift", event: "mdi:calendar-star" };
// The same icons as SVG paths, for the calendar page drawn in the mini card's banner.
const CD_PATHS = {
  birthday:
    "M12,6C13.11,6 14,5.1 14,4C14,3.62 13.9,3.27 13.71,2.97L12,0L10.29,2.97C10.1,3.27 10,3.62 10,4A2,2 0 0,0 12,6M16.6,16L15.53,14.92L14.45,16C13.15,17.29 10.87,17.3 9.56,16L8.5,14.92L7.4,16C6.75,16.64 5.88,17 4.96,17C4.23,17 3.56,16.77 3,16.39V21A1,1 0 0,0 4,22H20A1,1 0 0,0 21,21V16.39C20.44,16.77 19.77,17 19.04,17C18.12,17 17.25,16.64 16.6,16M18,9H13V7H11V9H6A3,3 0 0,0 3,12V13.54C3,14.62 3.88,15.5 4.96,15.5C5.5,15.5 6,15.3 6.34,14.93L8.5,12.8L10.61,14.93C11.35,15.67 12.64,15.67 13.38,14.93L15.5,12.8L17.65,14.93C18,15.3 18.5,15.5 19.03,15.5C20.11,15.5 21,14.62 21,13.54V12A3,3 0 0,0 18,9Z",
  holiday:
    "M15,18.54C17.13,18.21 19.5,18 22,18V22H5C5,21.35 8.2,19.86 13,18.9V12.4C12.16,12.65 11.45,13.21 11,13.95C10.39,12.93 9.27,12.25 8,12.25C6.73,12.25 5.61,12.93 5,13.95C5.03,10.37 8.5,7.43 13,7.04V7A1,1 0 0,1 14,6A1,1 0 0,1 15,7V7.04C19.5,7.43 22.96,10.37 23,13.95C22.39,12.93 21.27,12.25 20,12.25C18.73,12.25 17.61,12.93 17,13.95C16.55,13.21 15.84,12.65 15,12.39V18.54M7,2A5,5 0 0,1 2,7V2H7Z",
  trip: "M20.56 3.91C21.15 4.5 21.15 5.45 20.56 6.03L16.67 9.92L18.79 19.11L17.38 20.53L13.5 13.1L9.6 17L9.96 19.47L8.89 20.53L7.13 17.35L3.94 15.58L5 14.5L7.5 14.87L11.37 11L3.94 7.09L5.36 5.68L14.55 7.8L18.44 3.91C19 3.33 20 3.33 20.56 3.91Z",
  anniversary:
    "M9.06,1.93C7.17,1.92 5.33,3.74 6.17,6H3A2,2 0 0,0 1,8V10A1,1 0 0,0 2,11H11V8H13V11H22A1,1 0 0,0 23,10V8A2,2 0 0,0 21,6H17.83C19,2.73 14.6,0.42 12.57,3.24L12,4L11.43,3.22C10.8,2.33 9.93,1.94 9.06,1.93M9,4C9.89,4 10.34,5.08 9.71,5.71C9.08,6.34 8,5.89 8,5A1,1 0 0,1 9,4M15,4C15.89,4 16.34,5.08 15.71,5.71C15.08,6.34 14,5.89 14,5A1,1 0 0,1 15,4M2,12V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V12H13V20H11V12H2Z",
  event: "M19 19H5V8H19M16 1V3H8V1H6V3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.9 20.11 3 19 3H18V1M10.88 12H7.27L10.19 14.11L9.08 17.56L12 15.43L14.92 17.56L13.8 14.12L16.72 12H13.12L12 8.56L10.88 12Z",
};
// One loop of the banner's animations (s): the balloons sway once, the confetti fall once.
const CD_LOOP = 3;
// How often the calendars are fetched again (ms), and at each new day.
const CD_REFRESH = 30 * 60 * 1000;

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: 200 × 80, drawn to the banner's right edge. Bunting across the top, a calendar page
// showing the next event's day on a band of its type's colour, a present and two balloons that sway; confetti fall on
// the day itself. By night (the dark theme), a darker room.
const cdScene = ({ night, day, today, animate, type }) => {
  const band = CD_COLORS[type] || CD_COLORS.birthday;
  const flags = ["#e64980", "#f59f00", "#1c7ed6", "#37b24d", "#7048e8"];
  const bunting = Array.from({ length: 9 }, (_, i) => {
    const x = 14 + i * 20;
    const y = 6 + Math.sin((i / 8) * Math.PI) * 6;
    return `<path d="M${x} ${y} l7 0 l-3.5 9z" fill="${flags[i % flags.length]}"/>`;
  }).join("");
  const sway = (cx, delay) =>
    animate ? `<animateTransform attributeName="transform" type="rotate" values="-4 ${cx} 76;4 ${cx} 76;-4 ${cx} 76" dur="${CD_LOOP}s" begin="${delay}s" repeatCount="indefinite"/>` : "";
  const balloon = (cx, color, delay) =>
    `<g><path d="M${cx} 40 Q${cx - 3} 56 ${cx} 76" fill="none" stroke="${night ? "#8c7f95" : "#9c8478"}" stroke-width=".8"/><ellipse cx="${cx}" cy="30" rx="8" ry="10" fill="${color}"/><ellipse cx="${cx - 3}" cy="26" rx="2" ry="3" fill="#fff" opacity=".45"/>${sway(cx, delay)}</g>`;
  const confetti = today
    ? Array.from({ length: 14 }, (_, i) => {
        const x = 8 + ((i * 37) % 188);
        const c = flags[i % flags.length];
        const begin = ((i * CD_LOOP) / 14).toFixed(2);
        if (!animate) return `<rect x="${x}" y="${(12 + ((i * 23) % 56)).toFixed(0)}" width="3" height="5" rx="1" fill="${c}" transform="rotate(${(i * 47) % 180} ${x} ${12 + ((i * 23) % 56)})"/>`;
        return `<rect x="${x}" y="-6" width="3" height="5" rx="1" fill="${c}"><animate attributeName="y" from="-6" to="80" dur="${CD_LOOP}s" begin="${begin}s" repeatCount="indefinite"/></rect>`;
      }).join("")
    : "";
  return `<path d="M8 6 Q100 20 194 6" fill="none" stroke="${night ? "#8c7f95" : "#b08968"}" stroke-width=".8"/>${bunting}
    <g class="page"><rect x="62" y="42" width="26" height="32" rx="3" fill="${night ? "#3b3141" : "#fff"}" stroke="${night ? "#524659" : "#e2d6dc"}"/>
      <rect x="62" y="42" width="26" height="8" rx="3" fill="${band}"/><rect x="62" y="47" width="26" height="3" fill="${band}"/>
      <text x="75" y="68" text-anchor="middle" font-family="Roboto,sans-serif" font-size="13" font-weight="700" fill="${night ? "#fff" : "#0d2a45"}">${rcEsc(day)}</text></g>
    <g class="gift"><rect x="98" y="54" width="26" height="20" fill="#7048e8"/><rect x="96" y="49" width="30" height="6" fill="#845ef7"/>
      <rect x="108" y="49" width="6" height="25" fill="#fcc419"/><path d="M111 49 q-8 -8 -10 -2 q2 4 10 2 q8 -8 10 -2 q-2 4 -10 2" fill="none" stroke="#fcc419" stroke-width="2"/></g>
    ${balloon(156, "#f783ac", 0)}${balloon(176, "#74c0fc", CD_LOOP / 2)}${confetti}`;
};

// The mini card's calendar page: the month on a band of the event's colour, its day, its type's icon.
const cdPage = ({ night, month, day, type }) => {
  const c = CD_COLORS[type];
  return `<g transform="translate(140 6)"><rect width="42" height="58" rx="6" fill="${night ? "#3b3141" : "#fff"}" stroke="${night ? "#524659" : "#ead9e1"}"/>
    <path d="M0 6a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v8H0z" fill="${c}"/>
    <text x="21" y="11" text-anchor="middle" font-family="Roboto,sans-serif" font-size="8" font-weight="700" fill="#fff">${rcEsc(month)}</text>
    <text x="21" y="36" text-anchor="middle" font-family="Roboto,sans-serif" font-size="18" font-weight="700" fill="${night ? "#fff" : "#0d2a45"}">${rcEsc(day)}</text>
    <path transform="translate(15.5 40.5) scale(.46)" d="${CD_PATHS[type]}" fill="${c}"/></g>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const cdPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// ── Card ─────────────────────────────────────────────────────────────────────
class CountdownCard extends RcCard {
  static tag = "countdown-card";
  static i18n = CD_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, animations: true, days_ahead: 365, max_items: 4 };

  // The Anniversaries sensors of the home, when there are some.
  static getStubConfig(hass) {
    const entities = hass ? cdSources(hass).slice(0, 4) : [];
    return entities.length ? { entities } : {};
  }

  getCardSize() {
    return 5;
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._timer ??= setInterval(() => this._fetch(), CD_REFRESH);
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._timer);
    this._timer = undefined;
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  _ahead() {
    return Math.min(1500, Math.max(1, Number(this._config.days_ahead) || 365));
  }

  // The calendars' events over the next `days_ahead` days, from Home Assistant's REST API.
  async _fetch() {
    const h = this._hass;
    const ids = this._config.calendars || [];
    if (!h?.callApi || !ids.length || this._busy) return;
    this._busy = true;
    const today = cdMidnight(Date.now());
    const start = new Date(today).toISOString();
    // At most CD_FETCH_DAYS ahead: a daily recurring event over 1500 days would bring back thousands of occurrences.
    const end = new Date(today + Math.min(this._ahead(), CD_FETCH_DAYS) * 86400000).toISOString();
    try {
      const lists = await Promise.all(ids.map((id) => Promise.resolve(h.callApi("GET", `calendars/${id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)).catch(() => [])));
      this._cal = { day: today, key: ids.join(","), lists: Object.fromEntries(ids.map((id, i) => [id, lists[i]])) };
    } finally {
      this._busy = false;
    }
    this._sig = null;
    this._render();
  }

  _date(t, opts = { weekday: "short", day: "numeric", month: "short" }) {
    try {
      return cdIntl(Intl.DateTimeFormat, this._lang(), opts).format(new Date(t));
    } catch {
      return new Date(t).toDateString();
    }
  }

  // Every event of the next `days_ahead` days, soonest first.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const today = cdMidnight(Date.now());
    const cal = this._cal;
    const ids = c.calendars || [];
    // Fetched at first, every CD_REFRESH, and at each new day.
    if (ids.length && h.callApi && !this._busy && (!cal || cal.day !== today || cal.key !== ids.join(","))) this._fetch();
    const entities = c.entities || (c.events || ids.length ? [] : cdSources(h));
    const all = [
      ...(c.events || []).map((e) => cdFromConfig(e, today)),
      ...entities.map((id) => cdFromEntity(h, typeof id === "string" ? id : id?.entity, today)),
      ...(cal ? ids.flatMap((id) => cdFromCalendar(id, cal.lists[id], today)) : []),
    ].filter((e) => e && cdDays(e.date, today) <= this._ahead());
    all.sort((a, b) => a.date - b.date || a.name.localeCompare(b.name));
    const items = all.slice(0, Math.max(1, Math.round(Number(c.max_items) || 4))).map((e) => ({ ...e, days: cdDays(e.date, today) }));
    const next = items[0];
    return {
      items,
      next,
      state: !next ? "none" : next.days === 0 ? "today" : next.days <= 7 ? "soon" : "later",
      name: c.title || this._t("title"),
      today,
    };
  }

  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // "Today", "Tomorrow", "In 3 days".
  _when(days) {
    return days === 0 ? this._t("st_today") : days === 1 ? this._t("st_tomorrow") : this._tn("in", days, { n: days });
  }

  // What follows an event's date: the age reached, the years, how many days it lasts.
  _extra(e) {
    if (e.years && e.type === "birthday") return this._tn("turns", e.years);
    if (e.years) return this._tn("year", e.years, { n: e.years });
    if (e.end && e.end > e.date) return this._tn("day", Math.round((e.end - e.date) / 86400000) + 1, { n: Math.round((e.end - e.date) / 86400000) + 1 });
    return "";
  }

  // The illustrated header: the badge, the title, `sub` and the pill on the left, the party at the right, a 10 px
  // parquet strip edge to edge. `scene`: the room's drawing (the mini card draws its calendar page there).
  _banner(m, sub, scene, pill = "") {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const chip = pill ? `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge"><ha-icon icon="${rcEsc(m.next ? m.next.icon || CD_ICONS[m.next.type] : "mdi:calendar-star")}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${scene}</svg>
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see cdPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      cdPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  // The next event in big: its icon, the days left, its name with the age or the years, its date.
  _hero(e) {
    const extra = this._extra(e);
    let big;
    if (e.days === 0) big = `<span class="bn0">${rcEsc(this._t("today_big"))}</span>`;
    else {
      const [before, after] = this._t(rcPluralKey(CD_I18N, this._lang(), "day", e.days), { n: "\u0000" }).split("\u0000");
      big = `${before.trim() ? `<span class="bu">${rcEsc(before.trim())}</span>` : ""}<span class="bn">${e.days}</span><span class="bu">${rcEsc(after.trim())}</span>`;
    }
    const title = extra && e.years ? `${e.name} — ${extra}` : e.name;
    const date = [this._date(e.date), e.end && e.end > e.date ? this._date(e.end) : ""].filter(Boolean).join(" – ");
    return `<button class="hero t-${e.type}"${e.id ? ` data-id="${rcEsc(e.id)}"` : ""}>
      <span class="hi"><ha-icon icon="${rcEsc(e.icon || CD_ICONS[e.type])}"></ha-icon></span>
      <span class="ht"><span class="hb">${big}</span><span class="hn">${rcEsc(title)}</span><span class="hd">${rcEsc(date)}${extra && !e.years ? ` · ${rcEsc(extra)}` : ""}</span></span>
    </button>`;
  }

  _row(e) {
    const sub = [this._date(e.date), this._extra(e)].filter(Boolean).join(" · ");
    const pill = e.days <= 1 ? this._when(e.days) : this._tn("day", e.days, { n: e.days });
    return `<button class="row t-${e.type}"${e.id ? ` data-id="${rcEsc(e.id)}"` : ""}>
      <span class="ri"><ha-icon icon="${rcEsc(e.icon || CD_ICONS[e.type])}"></ha-icon></span>
      <span class="rt"><span class="rn">${rcEsc(e.name)}</span><span class="rs2">${rcEsc(sub)}</span></span>
      <span class="rp">${rcEsc(pill)}</span>
    </button>`;
  }

  // The next event's date alone: its name is in big right under the banner.
  _sub(m) {
    if (!m.next || this._config.show_subtitle === false) return "";
    return `<div class="subt">${rcEsc(this._date(m.next.date))}</div>`;
  }

  _draw(m) {
    const c = this._config;
    const dark = this._dark();
    const night = this._night();
    if (!this._changed([m.items, m.state, dark, night])) return;
    const status = m.next ? this._when(m.next.days) : this._t("st_none");
    const level = m.next ? m.next.type : "none";
    const scene = cdScene({ night, day: m.next ? this._date(m.next.date, { day: "numeric" }) : "", today: m.state === "today", animate: this._animate(), type: m.next?.type });
    const head =
      c.illustration !== false
        ? this._banner(m, this._sub(m), scene, status)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${rcEsc(m.next ? m.next.icon || CD_ICONS[m.next.type] : "mdi:calendar-star")}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div><span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span></div>${this._sub(m)}</div>
          </div>`;
    const rest = m.items.slice(1);
    const body = m.next
      ? `${this._hero(m.next)}${rest.length ? `<div class="box up"><div class="uh">${rcEsc(this._t("coming_up"))}</div>${rest.map((e) => this._row(e)).join("")}</div>` : ""}`
      : `<div class="box none">${rcEsc(this._t("nothing"))}</div>`;
    this._paint(level, head + body, "", ` st-${m.state}${m.state === "today" ? " today" : ""}${dark ? " dk" : ""}`);
    this._fitPill();
  }

  _bindAfter(root) {
    for (const b of root.querySelectorAll(".hero[data-id], .row[data-id]") || []) b.addEventListener("click", () => rcMoreInfo(this, b.dataset.id));
  }

  static styles = `
    ha-card { --c: #d6336c; }
    ha-card.lvl-birthday { --c: #d6336c; } ha-card.lvl-holiday { --c: #1c7ed6; } ha-card.lvl-trip { --c: #0c8599; }
    ha-card.lvl-anniversary { --c: #7048e8; } ha-card.lvl-event { --c: #e67700; } ha-card.lvl-none { --c: var(--rc-idle); }
    .t-birthday { --t: #d6336c; } .t-holiday { --t: #1c7ed6; } .t-trip { --t: #0c8599; } .t-anniversary { --t: #7048e8; } .t-event { --t: #e67700; }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { margin-top: 10px; border-radius: 12px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .none { font-size: 13px; color: var(--secondary-text-color); }
    .hero { all: unset; box-sizing: border-box; width: 100%; margin-top: 12px; display: flex; align-items: center; gap: 16px; padding: 16px;
            border-radius: 12px; background: color-mix(in srgb, var(--t) 12%, var(--card-background-color, #fff)); }
    .hero[data-id] { cursor: pointer; }
    .hero:focus-visible, .row:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .hi { flex: none; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; color: var(--t);
          background: var(--card-background-color, #fff); }
    .hi ha-icon { --mdc-icon-size: 40px; }
    .ht { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .hb { display: flex; align-items: baseline; gap: 6px; color: color-mix(in srgb, var(--t) 85%, var(--primary-text-color, #212121)); }
    .bn { font-size: 44px; font-weight: 700; line-height: 1; }
    .bn0 { font-size: 30px; font-weight: 700; line-height: 1.1; }
    .bu { font-size: 17px; font-weight: 500; }
    .hn { font-size: 16px; font-weight: 500; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .hd { font-size: 13px; color: var(--secondary-text-color); }
    .up { padding: 8px 12px 4px; }
    .uh { font-size: 12px; color: var(--secondary-text-color); padding: 2px 0 8px; border-bottom: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .row { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .row + .row { border-top: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .row[data-id] { cursor: pointer; }
    .ri { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--t);
          background: color-mix(in srgb, var(--t) 14%, transparent); }
    .ri ha-icon { --mdc-icon-size: 20px; }
    .rt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .rn { font-size: 14px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rs2 { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rp { flex: none; font-size: 13px; font-weight: 500; padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          color: color-mix(in srgb, var(--t) 60%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
    ha-card.dk .rp, ha-card.dk .hb { color: color-mix(in srgb, var(--t) 55%, #fff); }
    @container (max-width: 340px) {
      .hero { gap: 12px; padding: 12px; }
      .hi { width: 56px; height: 56px; } .hi ha-icon { --mdc-icon-size: 30px; }
      .bn { font-size: 36px; }
    }
    /* Illustrated header (banner): 90 px, edge to edge, the title on a pink party wall, the party at the right, a 10 px
       parquet strip at the bottom. The badge's icon is in the next event's colour, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #fff0f5 0%, #f8e1ea 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #241a2b 0%, #2f2238 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    /* The badge's icon: the event's colour today and in the coming week, grey further off or with nothing coming. */
    .st-later .banner, .st-none .banner { --ic: #6b7680; }
    .st-later .banner.night, .st-none .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.7); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #c8956a 0 22px, #d9ad84 22px 44px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #4a3628 0 22px, #5a4232 22px 44px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see cdPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the wall. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the party is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The mini card's calendar page stays whole: it is drawn at the right, clear of the zoom button. */
    ha-card.bn > .banner .room { right: 34px; }
    /* Under 340 px the chips need the room: the calendar page is hidden, as the other mini cards hide theirs. */
    @container (max-width: 340px) { ha-card.bn > .banner .room { display: none; } ha-card.bn > .banner .head { padding-right: 34px; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.7); }
    .banner.night .r { background: rgba(10,20,40,.4); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const cdSchema = (booleans) => (lang) => [
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "calendars", selector: { entity: { domain: "calendar", multiple: true } } },
  { name: "entities", selector: { entity: { domain: ["input_datetime", "sensor"], multiple: true } } },
  { name: "days_ahead", selector: { number: { min: 1, max: 1500, step: 1, mode: "box" } } },
  { name: "max_items", selector: { number: { min: 1, max: 12, step: 1, mode: "box" } } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(CD_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(CD_I18N, lang, "events", "language"),
];

const CD_HELPERS = ["title", "calendars", "entities", "days_ahead", "max_items", "zoom", "events", "language"];

const CountdownCardEditor = rcEditor({
  card: CountdownCard,
  helpers: CD_HELPERS,
  schema: cdSchema(["show_title", "show_subtitle", "illustration", "animations"]),
});

rcRegister(CountdownCard, CountdownCardEditor, "Countdown Card", "The days left until birthdays, holidays, trips and anniversaries: the next one in big, then those coming up");

// ── Mini card ────────────────────────────────────────────────────────────────
// The next event on two lines: the title and when, its name and the age reached as chips, and its calendar page at the
// right of the banner; the zoom button opens the full card in place.
class CountdownMiniCard extends rcMini(CountdownCard, "countdown-mini-card", "") {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    const night = this._night();
    const dark = this._dark();
    if (!this._changed(["mini", m.next, night, dark])) return;
    const e = m.next;
    const status = e ? this._when(e.days) : this._t("st_none");
    const chip = (text) => `<button class="r"${e?.id ? ` data-id="${rcEsc(e.id)}"` : ""} title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const chips = e ? [chip(e.name), e.years ? chip(this._extra(e)) : ""].join("") : chip(this._t("nothing"));
    const page = e ? cdPage({ night, month: this._date(e.date, { month: "short" }).replace(".", "").toUpperCase(), day: this._date(e.date, { day: "numeric" }), type: e.type }) : "";
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${e ? e.type : "none"} st-${m.state} bn${dark ? " dk" : ""}">${this._banner(m, `<div class="rs">${chips}</div>`, page, status)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    for (const el of root.querySelectorAll(".r[data-id]")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    this._fitPill();
  }
}

const CountdownMiniCardEditor = rcEditor({
  card: CountdownMiniCard,
  helpers: CD_HELPERS,
  schema: cdSchema(["show_title", "show_subtitle", "illustration", "animations", "zoom"]),
});

rcRegister(CountdownMiniCard, CountdownMiniCardEditor, "Countdown Mini Card", "The next event on two lines: when, its name and the age reached, and its calendar page, with a zoom to the full card");
