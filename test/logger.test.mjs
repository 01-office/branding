import assert from "node:assert/strict";
import { test } from "node:test";

import { createLogger } from "../dist/logger.js";

test("a level method emits its badge then the raw args via the injected console", () => {
  const calls = [];
  const logger = createLogger({ console: { log: (...a) => calls.push(a) } });

  logger.success("done", { id: 1 });

  assert.equal(calls.length, 1);
  const [format, openStyle, closeStyle, ...rest] = calls[0];
  assert.match(format, /%cSUCCESS%c/);
  assert.match(openStyle, /#16a34a/);
  assert.equal(closeStyle, "");
  assert.deepEqual(rest, ["done", { id: 1 }]);
});

test("exposes all five levels", () => {
  const logger = createLogger({ console: { log: () => {} } });
  for (const level of ["info", "warn", "error", "success", "debug"]) {
    assert.equal(typeof logger[level], "function");
  }
});

test("a per-level style override is applied", () => {
  const calls = [];
  const logger = createLogger({
    console: { log: (...a) => calls.push(a) },
    levels: { info: "color: hotpink" },
  });

  logger.info("hey");

  assert.match(calls[0]?.[1], /hotpink/);
});
