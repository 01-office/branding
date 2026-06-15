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

test("banner prints one info log per brand: header (caption + right-aligned url) then ASCII art, monospace and no color, no groups", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });

  // One info call per brand — two total, nothing else.
  assert.equal(c.calls.length, 2);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  for (const call of c.calls) {
    // [ "info", "%c<content>", "font-family: monospace" ]
    assert.equal(call.length, 3);
    assert.match(call[1], /^%c/);
    assert.equal(call[2], "font-family: monospace");
    assert.ok(!call[2].includes("color"));
  }

  // 01.works: header line has the caption at the start and the url at the end;
  // the ASCII art follows.
  const works = c.calls[0][1].slice(2); // drop the leading "%c"
  const worksHeader = works.split("\n")[0];
  assert.ok(worksHeader.startsWith("Website by"));
  assert.ok(worksHeader.endsWith("https://01.works"));
  assert.ok(works.includes("\\___/")); // a recognizable slice of the figlet art

  // The url is pushed to the right: there is padding between caption and url.
  assert.match(worksHeader, /^Website by {2,}https:\/\/01\.works$/);

  // 01.software: same structure.
  const software = c.calls[1][1].slice(2);
  const softwareHeader = software.split("\n")[0];
  assert.ok(softwareHeader.startsWith("Powered by"));
  assert.ok(softwareHeader.endsWith("https://01.software"));
  assert.ok(software.includes("\\___/"));
});

test("banner shows at most once per instance", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });
  show({ console: c });
  assert.equal(c.calls.length, 2);
});
