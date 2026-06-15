import assert from "node:assert/strict";
import { test } from "node:test";

const WEBSITE_LINK = "https://01.works";
const POWERED_LINK = "https://01.software";

const moduleUrl = new URL("../dist/index.js", import.meta.url);

async function importFreshBranding() {
  const url = new URL(moduleUrl);
  url.searchParams.set("test", crypto.randomUUID());
  return import(url);
}

test("default branding prints one combined info log per brand, once, with no console groups", async () => {
  const { showBranding } = await importFreshBranding();
  const groupCalls = [];
  const infoCalls = [];
  const groupEndCalls = [];
  const originalGroup = globalThis.console.group;
  const originalInfo = globalThis.console.info;
  const originalGroupEnd = globalThis.console.groupEnd;

  globalThis.console.group = (...args) => groupCalls.push(args);
  globalThis.console.info = (...args) => infoCalls.push(args);
  globalThis.console.groupEnd = (...args) => groupEndCalls.push(args);

  try {
    showBranding();
    showBranding();

    assert.equal(groupCalls.length, 0);
    assert.equal(groupEndCalls.length, 0);
    assert.equal(infoCalls.length, 2);

    // Each log: "%c<header>\n<art>" + a monospace style (no color).
    assert.equal(infoCalls[0]?.[1], "font-family: monospace");
    assert.equal(infoCalls[1]?.[1], "font-family: monospace");

    // Caption is the first line; the URL is the last line (right-aligned).
    const worksLines = infoCalls[0]?.[0].slice(2).split("\n");
    assert.equal(worksLines[0], "Website by");
    assert.ok(worksLines[worksLines.length - 1].endsWith(WEBSITE_LINK));

    const poweredLines = infoCalls[1]?.[0].slice(2).split("\n");
    assert.equal(poweredLines[0], "Powered by");
    assert.ok(poweredLines[poweredLines.length - 1].endsWith(POWERED_LINK));
  } finally {
    globalThis.console.group = originalGroup;
    globalThis.console.info = originalInfo;
    globalThis.console.groupEnd = originalGroupEnd;
  }
});

test("uses the supplied console target", async () => {
  const { showBranding } = await importFreshBranding();
  const calls = [];
  const globalCalls = [];
  const originalGroup = globalThis.console.group;
  const originalInfo = globalThis.console.info;
  const originalGroupEnd = globalThis.console.groupEnd;
  const target = {
    group: (...args) => calls.push(["group", ...args]),
    info: (...args) => calls.push(["info", ...args]),
    groupEnd: (...args) => calls.push(["groupEnd", ...args]),
  };

  globalThis.console.group = (...args) => globalCalls.push(args);
  globalThis.console.info = (...args) => globalCalls.push(args);
  globalThis.console.groupEnd = (...args) => globalCalls.push(args);

  try {
    showBranding({ console: target });
  } finally {
    globalThis.console.group = originalGroup;
    globalThis.console.info = originalInfo;
    globalThis.console.groupEnd = originalGroupEnd;
  }

  assert.equal(globalCalls.length, 0);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call[0] === "info"));
  assert.ok(calls[0][1].includes(WEBSITE_LINK));
  assert.ok(calls[1][1].includes(POWERED_LINK));
});
