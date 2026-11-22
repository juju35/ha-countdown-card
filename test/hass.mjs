// A mock Home Assistant with an Anniversaries sensor, a date helper, a timestamp sensor and a calendar (answered by
// callApi). The day is fixed by the tests (NOW): 22 November 2026, 10:00 local time.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });

export const NOW = new Date(2026, 10, 22, 10, 0).getTime();
export const day = (m, d, y = 2026) => new Date(y, m - 1, d).getTime();

export const makeHass = ({ calendar = true, ...overrides } = {}) => {
  const hass = {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    entities: {
      "sensor.sam_birthday": { platform: "anniversaries" },
      "input_datetime.trip": { platform: "input_datetime" },
      "sensor.lease_end": { platform: "template" },
    },
    states: {
      "sensor.sam_birthday": st("sensor.sam_birthday", "3", { friendly_name: "Sam's birthday", date: "2017-11-25", years_at_next_anniversary: 9, next_date: "2026-11-25" }),
      "input_datetime.trip": st("input_datetime.trip", "2027-01-02", { friendly_name: "Trip to the coast", has_date: true, has_time: false }),
      "sensor.lease_end": st("sensor.lease_end", "2027-03-01T09:00:00+01:00", { friendly_name: "Car lease end", device_class: "timestamp" }),
      "calendar.family": st("calendar.family", "off", { friendly_name: "Family" }),
    },
    api: [],
    ...overrides,
  };
  if (calendar)
    hass.callApi = async (method, path) => {
      hass.api.push([method, path]);
      return [
        { summary: "Christmas holidays", start: { date: "2026-12-19" }, end: { date: "2027-01-04" } },
        { summary: "Dentist", start: { dateTime: "2026-12-02T09:30:00+01:00" }, end: { dateTime: "2026-12-02T10:00:00+01:00" } },
      ];
    };
  return hass;
};
