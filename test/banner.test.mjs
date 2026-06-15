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

test("banner prints one info log per brand: caption, ASCII art, then right-aligned url chip below; banner monospace + url inverted style, no groups", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });

  // One info call per brand — two total, nothing else.
  assert.equal(c.calls.length, 2);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  for (const call of c.calls) {
    // [ "info", "%c<head>%c<url>", "<mono>", "<inverted>" ]
    assert.equal(call.length, 4);
    assert.equal(call[2], "font-family: monospace");
    // The URL chip is inverted: a background fill + a text color.
    assert.match(call[3], /background/);
    assert.match(call[3], /color/);
    // The format has two %c segments: one for the banner, one for the url.
    assert.equal(call[1].match(/%c/g)?.length, 2);
  }

  // 01.works: caption first line; url is the last line, right-aligned (padding
  // before the second %c); ASCII art between.
  const worksLines = c.calls[0][1].split("\n");
  assert.equal(worksLines[0], "%cWebsite by");
  assert.match(worksLines[worksLines.length - 1], /^ {2,}%chttps:\/\/01\.works$/);
  assert.ok(c.calls[0][1].includes("\\___/")); // a recognizable slice of the art

  // 01.software: same structure.
  const softwareLines = c.calls[1][1].split("\n");
  assert.equal(softwareLines[0], "%cPowered by");
  assert.match(
    softwareLines[softwareLines.length - 1],
    /^ {2,}%chttps:\/\/01\.software$/,
  );
  assert.ok(c.calls[1][1].includes("\\___/"));
});

test("banner shows at most once per instance", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });
  show({ console: c });
  assert.equal(c.calls.length, 2);
});
