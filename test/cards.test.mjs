import assert from "node:assert/strict";
import { test } from "node:test";
import { day, makeHass, NOW } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const cd = load({ now: NOW });
const { cards } = cd;
const json = (v) => JSON.parse(JSON.stringify(v));
const settle = () => new Promise((r) => setTimeout(r, 0));
const TODAY = day(11, 22);

// A card whose shadow root answers every selector with nodes recording their click listeners; the calendars fetched
// (callApi) before the test reads it.
const make = async (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  await settle();
  await settle();
  return card;
};
const ALL = { calendars: ["calendar.family"], entities: ["sensor.sam_birthday", "input_datetime.trip", "sensor.lease_end"] };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["countdown-card", "countdown-mini-card"]) {
    assert.ok(cd.customElements.get(tag), tag);
    assert.ok(cd.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(cd.window.customCards.map((c) => c.type)), ["countdown-card", "countdown-mini-card"]);
  assert.deepEqual(json(cards["countdown-card"].getStubConfig(makeHass())), { entities: ["sensor.sam_birthday"] });
});

test("types from the name, in several languages; a wedding anniversary is not a birthday", () => {
  assert.equal(cd.cdType("Sam's birthday"), "birthday");
  assert.equal(cd.cdType("Anniversaire de Léa"), "birthday");
  assert.equal(cd.cdType("Anniversaire de mariage"), "anniversary");
  assert.equal(cd.cdType("Vacances de Noël"), "holiday");
  assert.equal(cd.cdType("Reise nach Rom"), "trip");
  assert.equal(cd.cdType("Dentist"), "event");
  assert.equal(cd.cdType("Dentist", "trip"), "trip", "a given type wins");
});

test("dates: yearly ones come back with the years, one-off ones go once past", () => {
  const bday = cd.cdNext(cd.cdParse("2017-11-25"), true, TODAY);
  assert.deepEqual(json(bday), { date: day(11, 25), years: 9 });
  const passed = cd.cdNext(cd.cdParse("1990-03-10"), true, TODAY);
  assert.deepEqual(json(passed), { date: day(3, 10, 2027), years: 37 });
  assert.equal(cd.cdNext(cd.cdParse("2026-10-01"), false, TODAY), null);
  assert.deepEqual(json(cd.cdNext(cd.cdParse("12-24"), true, TODAY)), { date: day(12, 24), years: null });
  const e = cd.cdFromConfig({ name: "Wedding anniversary", date: "2014-01-19" }, TODAY);
  assert.deepEqual([e.type, e.years, e.date], ["anniversary", 13, day(1, 19, 2027)]);
});

test("calendars: all-day events end the day before their end date; one that has started counts as today", () => {
  const list = [
    { summary: "Christmas holidays", start: { date: "2026-12-19" }, end: { date: "2027-01-04" } },
    { summary: "School trip", start: { date: "2026-11-20" }, end: { date: "2026-11-24" } },
    { summary: "Old", start: { date: "2026-11-01" }, end: { date: "2026-11-02" } },
  ];
  const ev = cd.cdFromCalendar("calendar.family", list, TODAY);
  assert.equal(ev.length, 2);
  assert.deepEqual([ev[0].date, ev[0].end, ev[0].type], [day(12, 19), day(1, 3, 2027), "holiday"]);
  assert.deepEqual([ev[1].date, ev[1].end], [TODAY, day(11, 23)]);
});

test("dates: a 29 February comes on the 28th without one, and impossible days are no dates", () => {
  const leap = cd.cdParse("2000-02-29");
  assert.deepEqual(json(cd.cdNext(leap, true, TODAY)), { date: day(2, 28, 2027), years: 27 });
  assert.deepEqual(json(cd.cdParse("02-29")), { y: null, m: 1, d: 29 });
  for (const bad of ["02-30", "2025-02-29", "2024-13-01", "04-31", "00-10"]) assert.equal(cd.cdParse(bad), null, bad);
  assert.equal(cd.cdFromConfig({ name: "Typo", date: "02-30" }, TODAY), null);
});

test("calendars: an all-day event's last day across a clock change", () => {
  const tz = process.env.TZ;
  process.env.TZ = "Europe/Paris";
  try {
    // Paris moves to summer time on Sunday 28 March 2027: that day lasts 23 hours.
    const [ev] = cd.cdFromCalendar("calendar.family", [{ summary: "Weekend away", start: { date: "2027-03-27" }, end: { date: "2027-03-29" } }], TODAY);
    assert.equal(new Date(ev.end).getDate(), 28);
    assert.equal(new Date(ev.end).getHours(), 0);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});

test("calendars: asked for 400 days at most, whatever days_ahead", async () => {
  const hass = makeHass();
  await make("countdown-card", { ...ALL, days_ahead: 1500 }, hass);
  const q = new URLSearchParams(hass.api[0][1].split("?")[1]);
  assert.equal(Math.round((Date.parse(q.get("end")) - Date.parse(q.get("start"))) / 86400000), 400);
});

test("full card: the next event in big, then those coming up", async () => {
  const hass = makeHass();
  const card = await make("countdown-card", ALL, hass);
  assert.equal(hass.api.length, 1);
  assert.match(hass.api[0][1], /^calendars\/calendar\.family\?start=.+&end=.+/);
  const m = card._items;
  assert.deepEqual(
    json(m.items.map((e) => [e.name, e.days])),
    [
      ["Sam's birthday", 3],
      ["Dentist", 10],
      ["Christmas holidays", 27],
      ["Trip to the coast", 41],
    ],
  );
  assert.equal(m.state, "soon");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<span class="bpt">In 3 days<\/span>/);
  assert.match(html, /<div class="subt">Wed, Nov 25<\/div>/);
  assert.match(html, /<span class="bn">3<\/span><span class="bu">days<\/span>/);
  assert.match(html, /<span class="hn">Sam&#39;s birthday — turns 9<\/span>/);
  assert.match(html, /<span class="rp">27 days<\/span>/);
  assert.match(html, /Sat, Dec 19 · 16 days/, "the holidays last 16 days");
  assert.match(html, /<ha-card class="lvl-birthday st-soon">/);
});

test("today, tomorrow and nothing coming up", async () => {
  const today = await make("countdown-card", { events: [{ name: "Party", date: "2026-11-22" }] });
  assert.equal(today._items.state, "today");
  assert.match(today.shadowRoot.innerHTML, /<span class="bn0">Today!<\/span>/);
  assert.match(today.shadowRoot.innerHTML, /class="lvl-event st-today today"/);
  const tomorrow = await make("countdown-card", { events: [{ name: "Party", date: "2026-11-23" }] });
  assert.match(tomorrow.shadowRoot.innerHTML, /<span class="bpt">Tomorrow<\/span>/);
  assert.match(tomorrow.shadowRoot.innerHTML, /<span class="bn">1<\/span><span class="bu">day<\/span>/);
  const none = await make("countdown-card", { events: [{ name: "Far", date: "2028-01-01" }] });
  assert.equal(none._items.state, "none");
  assert.match(none.shadowRoot.innerHTML, /Nothing coming up/);
});

test("days_ahead and max_items", async () => {
  const card = await make("countdown-card", { ...ALL, days_ahead: 30, max_items: 2 });
  assert.deepEqual(json(card._items.items.map((e) => e.name)), ["Sam's birthday", "Dentist"]);
});

test("plurals: the few form where the language has one", async () => {
  const hass = makeHass({ language: "ru", locale: { language: "ru" } });
  const card = await make("countdown-card", { events: [{ name: "Отпуск", date: "2026-11-25" }] }, hass);
  assert.match(card.shadowRoot.innerHTML, /Через 3 дня/);
  assert.match(card.shadowRoot.innerHTML, /<span class="bn">3<\/span><span class="bu">дня<\/span>/);
});

test("mini card: when, the name and the age as chips, and the calendar page", async () => {
  const card = await make("countdown-mini-card", ALL);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-birthday st-soon bn">/);
  assert.match(html, /<span class="bpt">In 3 days<\/span>/);
  assert.match(html, /<span>Sam&#39;s birthday<\/span>/);
  assert.match(html, /<span>turns 9<\/span>/);
  assert.match(html, />NOV<\/text>/);
  assert.match(html, />25<\/text>/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="hero t-birthday"/);
});

test("the rows open their entity's details", async () => {
  const card = await make("countdown-card", ALL);
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  const rows = [{ dataset: { id: "input_datetime.trip" }, addEventListener(_type, fn) { this.fn = fn; } }];
  card.shadowRoot.querySelectorAll = (s) => (s.includes(".row[data-id]") ? rows : []);
  card._bindAfter(card.shadowRoot);
  rows[0].fn();
  assert.deepEqual(events, ["input_datetime.trip"]);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(cd.CD_I18N.en);
  for (const [lang, table] of Object.entries(cd.CD_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(cd.CD_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (cd.customElements.get("countdown-card-editor"))();
  ed.setConfig({ type: "custom:countdown-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["calendars", "entities", "days_ahead", "max_items", "illustration_theme", "events", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:countdown-card", days_ahead: 365, max_items: 4, calendars: ["calendar.family"] } } });
  assert.deepEqual(json(out), { type: "custom:countdown-card", calendars: ["calendar.family"] });
});

test("plurals: the Slovenian dual", async () => {
  const sl = await make("countdown-card", { ...ALL, language: "sl" });
  assert.deepEqual([1, 2, 3, 5, 102].map((n) => sl._tn("day", n)), ["1 dan", "2 dneva", "3 dnevi", "5 dni", "102 dneva"]);
  assert.equal(sl._tn("in", 2), "Čez 2 dneva");
  assert.equal(sl._tn("year", 2), "2 leti");
});

test("plurals: the age a birthday reaches, in Polish, Romanian and Russian", async () => {
  const card = (language) => make("countdown-card", { ...ALL, language });
  const pl = await card("pl");
  assert.deepEqual([1, 3, 5, 22].map((n) => pl._tn("turns", n)), ["kończy 1 rok", "kończy 3 lata", "kończy 5 lat", "kończy 22 lata"]);
  const ro = await card("ro");
  assert.deepEqual([1, 9, 20].map((n) => ro._tn("turns", n)), ["împlinește 1 an", "împlinește 9 ani", "împlinește 20 de ani"]);
  const ru = await card("ru");
  assert.deepEqual([21, 3, 9].map((n) => ru._tn("turns", n)), ["исполняется 21 год", "исполняется 3 года", "исполняется 9 лет"]);
});
