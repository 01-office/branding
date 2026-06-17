import assert from "node:assert/strict";
import { test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { showBranding } from "../dist/index.js";

const moduleUrl = new URL("../dist/react.js", import.meta.url);

test("exports Branding and useBranding functions", async () => {
  const mod = await import(moduleUrl);

  assert.equal(typeof mod.Branding, "function");
  assert.equal(typeof mod.useBranding, "function");
});

test("Branding renders nothing and is SSR-safe, including with custom groups", async () => {
  const { Branding } = await import(moduleUrl);
  const calls = [];
  const originalInfo = globalThis.console.info;
  const originalGroup = globalThis.console.group;

  globalThis.console.info = (...args) => calls.push(args);
  globalThis.console.group = (...args) => calls.push(args);

  let markup;
  let markupWithGroups;
  try {
    markup = renderToStaticMarkup(React.createElement(Branding));
    markupWithGroups = renderToStaticMarkup(
      React.createElement(Branding, {
        groups: [{ label: "Made by", link: "https://acme.test" }],
      }),
    );
  } finally {
    globalThis.console.info = originalInfo;
    globalThis.console.group = originalGroup;
  }

  assert.equal(markup, "");
  assert.equal(markupWithGroups, "");
  // The effect only runs on the client, so server rendering logs nothing.
  assert.equal(calls.length, 0);
});

test("ships a 'use client' directive for the React entry", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(moduleUrl, "utf8");

  assert.match(source, /^["']use client["'];/);
});

test("resolveBrandingShow without groups or bundled flags returns the shared showBranding singleton", async () => {
  const { resolveBrandingShow } = await import(moduleUrl);
  assert.equal(resolveBrandingShow(), showBranding);
});

test("resolveBrandingShow with includeWorks returns a banner printer that includes 01.works", async () => {
  const { resolveBrandingShow } = await import(moduleUrl);
  const show = resolveBrandingShow(undefined, { includeWorks: true });

  // It must be a fresh instance, not the default singleton.
  assert.notEqual(show, showBranding);

  const calls = [];
  show({
    console: {
      group: (...a) => calls.push(["group", ...a]),
      info: (...a) => calls.push(["info", ...a]),
      groupEnd: (...a) => calls.push(["groupEnd", ...a]),
    },
  });

  assert.equal(calls.length, 1);
  assert.ok(calls.every((call) => call[0] === "info"));
  assert.ok(calls.some((call) => call[1].includes("https://01.works")));
  assert.ok(calls.every((call) => !call[1].includes("https://01.software")));
});

test("resolveBrandingShow with includeWorks and includeSoftware returns both bundled banners", async () => {
  const { resolveBrandingShow } = await import(moduleUrl);
  const show = resolveBrandingShow(undefined, {
    includeWorks: true,
    includeSoftware: true,
  });

  // It must be a fresh instance, not the default singleton.
  assert.notEqual(show, showBranding);

  const calls = [];
  show({
    console: {
      group: (...a) => calls.push(["group", ...a]),
      info: (...a) => calls.push(["info", ...a]),
      groupEnd: (...a) => calls.push(["groupEnd", ...a]),
    },
  });

  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call[0] === "info"));
  assert.ok(calls.some((call) => call[1].includes("https://01.works")));
  assert.ok(calls.some((call) => call[1].includes("https://01.software")));
});

test("resolveBrandingShow with groups returns a printer that emits the configured groups", async () => {
  const { resolveBrandingShow } = await import(moduleUrl);
  const show = resolveBrandingShow([{ label: "Made by", link: "https://acme.test" }]);

  // It must be a fresh instance, not the default singleton.
  assert.notEqual(show, showBranding);

  const calls = [];
  show({
    console: {
      group: (...a) => calls.push(["group", ...a]),
      info: (...a) => calls.push(["info", ...a]),
      groupEnd: (...a) => calls.push(["groupEnd", ...a]),
    },
  });

  assert.deepEqual(calls, [
    ["group", "Made by"],
    ["info", "https://acme.test"],
    ["groupEnd"],
  ]);
});
