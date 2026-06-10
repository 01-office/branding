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

test("logs two open groups once after two invocations", async () => {
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

    assert.equal(groupCalls.length, 2);
    assert.equal(groupCalls[0]?.[0], "Website by");
    assert.equal(groupCalls[1]?.[0], "Powered by");
    assert.equal(infoCalls.length, 2);
    assert.equal(infoCalls[0]?.[0], WEBSITE_LINK);
    assert.equal(infoCalls[1]?.[0], POWERED_LINK);
    assert.equal(groupEndCalls.length, 2);
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
  assert.deepEqual(calls[0], ["group", "Website by"]);
  assert.deepEqual(calls[1], ["info", WEBSITE_LINK]);
  assert.deepEqual(calls[2], ["groupEnd"]);
  assert.deepEqual(calls[3], ["group", "Powered by"]);
  assert.deepEqual(calls[4], ["info", POWERED_LINK]);
  assert.deepEqual(calls[5], ["groupEnd"]);
});
