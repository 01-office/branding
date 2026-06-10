import assert from "node:assert/strict";
import { test } from "node:test";

const moduleUrl = new URL("../dist/index.js", import.meta.url);

async function importFreshBranding() {
  const url = new URL(moduleUrl);
  url.searchParams.set("test", crypto.randomUUID());
  return import(url);
}

test("logs one styled branding message after two invocations", async () => {
  const { showBranding } = await importFreshBranding();
  const calls = [];
  const originalInfo = globalThis.console.info;

  globalThis.console.info = (...args) => calls.push(args);

  try {
    showBranding();
    showBranding();
  } finally {
    globalThis.console.info = originalInfo;
  }

  assert.equal(calls.length, 1);
  assert.match(calls[0][0], /%c01\.works%c/);
  assert.match(calls[0][0], /https:\/\/01\.works/);
  assert.match(calls[0][1], /background:\s*#000/);
  assert.match(calls[0][1], /color:\s*#9fff6b/);
});

test("uses the supplied console target", async () => {
  const { showBranding } = await importFreshBranding();
  const calls = [];
  const globalCalls = [];
  const originalInfo = globalThis.console.info;
  const target = {
    info: (...args) => calls.push(args),
  };

  globalThis.console.info = (...args) => globalCalls.push(args);

  try {
    showBranding({ console: target });
  } finally {
    globalThis.console.info = originalInfo;
  }

  assert.equal(globalCalls.length, 0);
  assert.equal(calls.length, 1);
});
