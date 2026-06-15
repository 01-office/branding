import assert from "node:assert/strict";
import { test } from "node:test";

import { createBranding } from "../dist/branding.js";

test("createBranding emits the configured groups to the injected console", () => {
  const calls = [];
  const show = createBranding({
    groups: [{ label: "Made by", link: "https://acme.test" }],
  });
  const target = {
    group: (...a) => calls.push(["group", ...a]),
    info: (...a) => calls.push(["info", ...a]),
    groupEnd: (...a) => calls.push(["groupEnd", ...a]),
  };

  show({ console: target });

  assert.deepEqual(calls, [
    ["group", "Made by"],
    ["info", "https://acme.test"],
    ["groupEnd"],
  ]);
});

test("each branding instance shows at most once", () => {
  let groupCount = 0;
  const show = createBranding({ groups: [{ label: "L", link: "https://x.test" }] });
  const target = {
    group: () => {
      groupCount += 1;
    },
    info: () => {},
    groupEnd: () => {},
  };

  show({ console: target });
  show({ console: target });

  assert.equal(groupCount, 1);
});
