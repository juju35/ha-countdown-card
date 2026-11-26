# Changelog

## 1.0.4 - 2026-11-26

### Fixes
- Full card: the header no longer repeats what the big event under it shows. The status pill (*In 3 days*) is gone, and the subtitle is today's date instead of the event's date (none on the event's day).
- Mini card: it reads on two lines. The event's name and the age reached are one line of text instead of two chips, and the status pill stays on the title row instead of a third line (the calendar page keeps only the room it needs).
- Icons are centred in their badges and in the zoom / collapse button. Home Assistant's `<ha-icon>` is inline, so it sat on a line of text, a few pixels off; the cards now lay it out as a box of the icon's size.

## 1.0.3 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/shared/` (entry `src/shared/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features
- First release: `countdown-card` and `countdown-mini-card`. The next event in big — its picture, the days left, the age reached or the years, its date — then those coming up with their days; the mini card shows when and its calendar page. Events from calendars, Anniversaries sensors, date helpers, timestamp sensors and an `events` list (yearly or not); the type (birthday, holiday, trip, anniversary) found in the name when not given; an illustrated header with bunting, a present and balloons, confetti on the day.
