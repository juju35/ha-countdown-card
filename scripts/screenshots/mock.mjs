// The mock home of the screenshots and animations: neutral events (a birthday from an Anniversaries sensor, holidays
// and a dentist from a calendar, a trip on a date helper, a wedding anniversary in the config). The clock is fixed, so
// that a capture only changes when the card does: 22 November 2026, or the day of the birthday.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-11-01T00:00:00Z" });
const day = (m, d, y = 2026, h = 10) => new Date(y, m - 1, d, h).getTime();

// `scene`: soon (the birthday in 3 days), today (the birthday is today), later (nothing within a week), none (nothing
// within `days_ahead`).
const SCENES = {
  soon: { now: day(11, 22) },
  today: { now: day(11, 25) },
  later: { now: day(11, 26) },
  none: { now: day(11, 22), config: { events: [{ name: "Wedding anniversary", date: "2014-01-19" }], entities: [], calendars: [], days_ahead: 30 } },
};

export const nowOf = (scene) => SCENES[scene].now;

// The page's clock and the card's callApi, as script source: window.Date fixed at the scene's time, window.__api answering
// the calendar requests from the events put on the hass object (`this.__calendar`).
export const pageScript = (scene) => `(() => {
  const N = ${SCENES[scene].now};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
  window.__api = async function () { return this.__calendar || []; };
})();`;

const CALENDAR = [
  { summary: "Christmas holidays", start: { date: "2026-12-19" }, end: { date: "2027-01-04" } },
  { summary: "Dentist", start: { dateTime: "2026-12-02T09:30:00+01:00" }, end: { dateTime: "2026-12-02T10:00:00+01:00" } },
];

export const setup = (s) => {
  const v = SCENES[s.scene];
  const states = {
    "sensor.sam_birthday": st("sensor.sam_birthday", "3", { friendly_name: "Sam's birthday", date: "2017-11-25", years_at_next_anniversary: 9, next_date: s.scene === "later" ? "2027-11-25" : "2026-11-25" }),
    "input_datetime.trip": st("input_datetime.trip", "2027-01-02", { friendly_name: "Trip to the coast", has_date: true, has_time: false }),
    "calendar.family": st("calendar.family", "off", { friendly_name: "Family" }),
  };
  if (s.scene === "later") states["sensor.sam_birthday"].attributes.years_at_next_anniversary = 10;
  return {
    hass: {
      language: "en",
      locale: { language: "en" },
      entities: { "sensor.sam_birthday": { entity_id: "sensor.sam_birthday", platform: "anniversaries" } },
      states,
      // The card's calendar requests: the same events whatever the range.
      __calendar: CALENDAR,
    },
    config: {
      calendars: ["calendar.family"],
      entities: ["sensor.sam_birthday", "input_datetime.trip"],
      events: [{ name: "Wedding anniversary", date: "2014-01-19" }],
      ...v.config,
      ...s.config,
    },
    open: s.open,
  };
};
