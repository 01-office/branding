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

    // Each log: "%c<head>%c<url>" + a monospace style + an inverted url style.
    assert.equal(infoCalls[0]?.[1], "font-family: monospace");
    assert.equal(infoCalls[1]?.[1], "font-family: monospace");
    assert.match(infoCalls[0]?.[2], /background/);
    assert.match(infoCalls[1]?.[2], /background/);

    // Caption starts each log; the URL ends it (after the second %c).
    assert.ok(infoCalls[0]?.[0].startsWith("%cWebsite by"));
    assert.ok(infoCalls[0]?.[0].endsWith(`%c${WEBSITE_LINK}`));
    assert.ok(infoCalls[1]?.[0].startsWith("%cPowered by"));
    assert.ok(infoCalls[1]?.[0].endsWith(`%c${POWERED_LINK}`));
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
