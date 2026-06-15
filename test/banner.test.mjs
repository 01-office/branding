import assert from "node:assert/strict";
import { test } from "node:test";

import { createBrandingBanner } from "../dist/branding.js";

function fakeConsole() {
  const calls = [];
  return {
    calls,
    group: (...a) => calls.push(["group", ...a]),
    groupEnd: (...a) => calls.push(["groupEnd", ...a]),
    info: (...a) => calls.push(["info", ...a]),
  };
}

test("banner prints captions, colored art, and urls via info with no console groups", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });

  // Exactly six info calls, nothing else.
  assert.equal(c.calls.length, 6);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  // Captions are %c-styled and dim.
  assert.equal(c.calls[0][1], "%cWebsite by");
  assert.equal(c.calls[0][2], "color: #888888");
  assert.equal(c.calls[3][1], "%cPowered by");
  assert.equal(c.calls[3][2], "color: #888888");

  // Art lines are %c-styled with the brand colors.
  assert.match(c.calls[1][1], /^%c/);
  assert.match(c.calls[1][2], /#2563eb/);
  assert.match(c.calls[4][1], /^%c/);
  assert.match(c.calls[4][2], /#7c3aed/);

  // Plain clickable URLs.
  assert.equal(c.calls[2][1], "https://01.works");
  assert.equal(c.calls[5][1], "https://01.software");
});

test("banner shows at most once per instance", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });
  show({ console: c });
  assert.equal(c.calls.length, 6);
});
