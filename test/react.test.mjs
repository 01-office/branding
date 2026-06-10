import assert from "node:assert/strict";
import { test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const moduleUrl = new URL("../dist/react.js", import.meta.url);

test("exports Branding and useBranding functions", async () => {
  const mod = await import(moduleUrl);

  assert.equal(typeof mod.Branding, "function");
  assert.equal(typeof mod.useBranding, "function");
});

test("Branding renders nothing and is SSR-safe", async () => {
  const { Branding } = await import(moduleUrl);
  const calls = [];
  const originalInfo = globalThis.console.info;

  globalThis.console.info = (...args) => calls.push(args);

  let markup;
  try {
    markup = renderToStaticMarkup(React.createElement(Branding));
  } finally {
    globalThis.console.info = originalInfo;
  }

  assert.equal(markup, "");
  // The effect only runs on the client, so server rendering logs nothing.
  assert.equal(calls.length, 0);
});

test("ships a 'use client' directive for the React entry", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(moduleUrl, "utf8");

  assert.match(source, /^["']use client["'];/);
});
