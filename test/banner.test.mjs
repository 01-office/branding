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

test("banner prints nothing by default", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });

  assert.equal(c.calls.length, 0);
});

test("banner can include the 01.works brand when explicitly configured", () => {
  const show = createBrandingBanner({ includeWorks: true });
  const c = fakeConsole();
  show({ console: c });

  assert.equal(c.calls.length, 1);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  for (const call of c.calls) {
    // [ "info", "%c<content>", "font-family: monospace" ]
    assert.equal(call.length, 3);
    assert.match(call[1], /^%c/);
    assert.equal(call[2], "font-family: monospace");
    assert.ok(!call[2].includes("color"));
  }

  // 01.works: caption is the first line; the url is the last line, right-aligned
  // (indented with padding); the ASCII art sits between them.
  const works = c.calls[0]?.[1].slice(2); // drop the leading "%c"
  const worksLines = works.split("\n");
  assert.equal(worksLines[0], "Website by");
  assert.match(worksLines[worksLines.length - 1], /^ {2,}https:\/\/01\.works$/);
  assert.ok(works.includes("\\___/")); // a recognizable slice of the figlet art
  assert.ok(!works.includes("01.software"));
});

test("banner can include the 01.software brand when explicitly configured", () => {
  const show = createBrandingBanner({ includeWorks: true, includeSoftware: true });
  const c = fakeConsole();
  show({ console: c });

  assert.equal(c.calls.length, 2);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  // 01.software: same structure.
  const software = c.calls[1]?.[1].slice(2);
  const softwareLines = software.split("\n");
  assert.equal(softwareLines[0], "Powered by");
  assert.match(
    softwareLines[softwareLines.length - 1],
    /^ {2,}https:\/\/01\.software$/,
  );
  assert.ok(software.includes("\\___/"));
});

test("banner can include only the 01.software brand when explicitly configured", () => {
  const show = createBrandingBanner({ includeSoftware: true });
  const c = fakeConsole();
  show({ console: c });

  assert.equal(c.calls.length, 1);
  assert.ok(c.calls.every((call) => call[0] === "info"));
  assert.ok(c.calls[0]?.[1].includes("https://01.software"));
  assert.ok(!c.calls[0]?.[1].includes("https://01.works"));
});

test("banner shows at most once per instance", () => {
  const show = createBrandingBanner({ includeWorks: true });
  const c = fakeConsole();
  show({ console: c });
  show({ console: c });
  assert.equal(c.calls.length, 1);
});
