// Renders the countdown cards with mock events and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/countdown.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Stills: animations: false stops the balloons and the confetti, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
for (const scene of ["soon", "today", "later", "none"]) {
  await shoot({ prefix: "cd", tag: "countdown-card", shots: still(scene, { scene }), setup, ws: pageScript(scene) });
}
await shoot({ prefix: "cd", tag: "countdown-card", shots: still("narrow", { scene: "soon", width: 300 }), setup, ws: pageScript("soon") });
await shoot({ prefix: "cd-mini", tag: "countdown-mini-card", shots: [...still("soon", { scene: "soon" }), ...still("zoom", { scene: "soon", open: ".zoom" })], setup, ws: pageScript("soon") });
await shoot({ prefix: "cd-mini", tag: "countdown-mini-card", shots: still("today", { scene: "today" }), setup, ws: pageScript("today") });
