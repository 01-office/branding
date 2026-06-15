import assert from "node:assert/strict";
import { test } from "node:test";

import { assemble, badge, log, segment } from "../dist/core.js";

test("assemble wraps a segment with %c markers and a paired reset style", () => {
  const out = assemble([segment("hi", "color: red")]);
  assert.equal(out.format, "%chi%c");
  assert.deepEqual(out.styles, ["color: red", ""]);
});

test("assemble passes plain strings through unstyled", () => {
  const out = assemble(["plain ", segment("X", "color: blue")]);
  assert.equal(out.format, "plain %cX%c");
  assert.deepEqual(out.styles, ["color: blue", ""]);
});

test("segment converts a CSS object to a css string (camelCase to kebab-case)", () => {
  const seg = segment("x", { backgroundColor: "#000", color: "#fff" });
  assert.equal(seg.css, "background-color: #000; color: #fff");
});

test("badge applies default padding/weight and merges an extra style", () => {
  const seg = badge("API", "color: #fff");
  assert.match(seg.css, /padding: 2px 6px/);
  assert.match(seg.css, /font-weight: 600/);
  assert.match(seg.css, /color: #fff/);
});

test("log emits one console.log call with the format then the styles", () => {
  const calls = [];
  const original = globalThis.console.log;
  globalThis.console.log = (...args) => calls.push(args);
  try {
    log(segment("hi", "color: red"));
  } finally {
    globalThis.console.log = original;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.[0], "%chi%c");
  assert.equal(calls[0]?.[1], "color: red");
  assert.equal(calls[0]?.[2], "");
});
