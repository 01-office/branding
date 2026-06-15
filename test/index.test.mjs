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

test("default branding prints ASCII banners via info once, with no console groups", async () => {
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
    assert.equal(infoCalls.length, 6);
    // Captions
    assert.equal(infoCalls[0]?.[0], "%cWebsite by");
    assert.equal(infoCalls[3]?.[0], "%cPowered by");
    // URLs
    assert.equal(infoCalls[2]?.[0], WEBSITE_LINK);
    assert.equal(infoCalls[5]?.[0], POWERED_LINK);
    // Brand colors on the art lines
    assert.match(infoCalls[1]?.[1], /#2563eb/);
    assert.match(infoCalls[4]?.[1], /#7c3aed/);
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
  assert.equal(calls.length, 6);
  assert.ok(calls.every((call) => call[0] === "info"));
  assert.deepEqual(calls[2], ["info", WEBSITE_LINK]);
  assert.deepEqual(calls[5], ["info", POWERED_LINK]);
});
