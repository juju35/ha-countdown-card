// ── Countdown ────────────────────────────────────────────────────────────────
// The events come from calendars (their events over the next `days_ahead` days), from entities (an `input_datetime`,
// a `timestamp` sensor, an Anniversaries sensor) and from the `events` list of the config. Each one is brought down to
// { name, date (local midnight), type, years, end, id }; a yearly one (a birthday, an anniversary, a date without a
// year) comes back every year. The type, when not given, is found in the name.
export const CD_TYPES = ["birthday", "holiday", "trip", "anniversary", "event"];
export const CD_WEDDING = /wedding|mariage|hochzeit|boda|matrimonio|bruiloft|ślub|casamento|свадьб|весілл|esküvő|svatb|svadb|poroka|kāzu|γάμου|nunt|bryllup|bröllop|сватб|venčanj|венчањ/i;
export const CD_MATCH = {
  anniversary: /anniversary|jahrestag|aniversario|anniversario|jubileum|rocznica|годовщин|річниц|évforduló|výročí|obletnic|gadadien|επέτειο|aniversare|årsdag|годишнин|godišnjic|годишњиц/i,
  birthday:
    /birthday|\bb-?day\b|anniversaire|geburtstag|cumpleaños|compleanno|verjaardag|urodzin|aniversário|день рождения|день народження|születésnap|narozenin|narodenin|rojstn|dzimšanas|γενέθλια|ziua de naștere|fødselsdag|födelsedag|рожден ден|rođendan|рођендан/i,
  holiday: /holiday|vacances|vacation|congés|ferien|urlaub|vacaciones|vacanze|vakantie|wakacje|férias|отпуск|каникул|відпустк|канікул|szabadság|prázdnin|dovolen|počitnic|brīvdien|διακοπ|vacanț|ferie|semester|ваканц|празни|odmor|одмор/i,
  trip: /trip|voyage|travel|flight|\bvol\b|reise|viaje|viaggio|\breis\b|podróż|viagem|поездк|путешеств|подорож|utazás|výlet|potovan|ceļojum|ταξίδ|călători|rejse|\bresa\b|пътуван|putovanj|путовањ/i,
};

// The type of an event from its name: a wedding anniversary before a birthday ("anniversaire" is a birthday in French).
export const cdType = (name, given) => {
  if (CD_TYPES.includes(given)) return given;
  const n = String(name || "");
  if (CD_WEDDING.test(n)) return "anniversary";
  return ["anniversary", "birthday", "holiday", "trip"].find((t) => CD_MATCH[t].test(n)) || "event";
};

// The days in a month (`m` from 0); a year unknown counts as a leap year, so a birthday on 02-29 is a date.
export const cdMonthDays = (y, m) => new Date(y ?? 2024, m + 1, 0).getDate();

// Local midnight of a date: "YYYY-MM-DD", "MM-DD" (no year), an ISO date-time or a Date. A day the month does not
// have ("02-30", "2025-02-29", "2024-13-01") is no date.
export const cdParse = (v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : { y: v.getFullYear(), m: v.getMonth(), d: v.getDate() };
  const s = String(v).trim();
  const valid = (y, m, d) => (m >= 0 && m <= 11 && d >= 1 && d <= cdMonthDays(y, m) ? { y, m, d } : null);
  const md = /^(\d{1,2})-(\d{1,2})$/.exec(s);
  if (md) return valid(null, Number(md[1]) - 1, Number(md[2]));
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) return valid(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};

export const cdMidnight = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// The next occurrence of an event from `today` (local midnight, ms): { date, years } — the date itself when it is not
// yearly (null once past), else this year's or next year's, with the years since the first one when its year is known.
// A yearly 29 February comes on the 28th in the years without one.
export const cdNext = (p, yearly, today) => {
  if (!p) return null;
  const now = new Date(today);
  if (!yearly && p.y != null) {
    const t = new Date(p.y, p.m, p.d).getTime();
    return t >= today ? { date: t, years: null } : null;
  }
  const on = (y) => new Date(y, p.m, Math.min(p.d, cdMonthDays(y, p.m))).getTime();
  let y = now.getFullYear();
  let t = on(y);
  if (t < today) t = on(++y);
  return { date: t, years: p.y != null && y > p.y ? y - p.y : null };
};

// Whole days from `today` to `date` (both local midnights): rounded, so that a daylight saving change never counts.
export const cdDays = (date, today) => Math.round((date - today) / 86400000);

// An event from the config's `events` list.
export const cdFromConfig = (e, today) => {
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
export const cdFromEntity = (hass, id, today) => {
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
export const cdFromCalendar = (id, list, today) =>
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
export const cdSources = (hass) => Object.keys(hass.entities || {}).filter((id) => hass.entities[id].platform === "anniversaries");

// The Intl formats, made once per language and options (a render formats many dates).
export const cdIntlCache = new Map();
export const cdIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!cdIntlCache.has(key)) cdIntlCache.set(key, new Kind(lang, opts));
  return cdIntlCache.get(key);
};
