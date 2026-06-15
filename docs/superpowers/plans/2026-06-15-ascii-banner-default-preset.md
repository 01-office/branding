# ASCII Banner Default Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default `showBranding()` output (two `console.group` blocks) with two emphasized ASCII-art banners for `01.works` and `01.software`, styled via `%c` with brand colors and dim captions, no console groups.

**Architecture:** Add a dedicated `createBrandingBanner()` factory + hardcoded figlet "Standard" ASCII constants to `src/branding.ts`. Repoint `showBranding` in `src/index.ts` from `createBranding()` to `createBrandingBanner()`. The generic `createBranding({ groups })` factory (custom branding / React `groups` prop) is untouched.

**Tech Stack:** TypeScript (NodeNext, strict: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Node built-in test runner with `.mjs` tests importing from `dist/`, pnpm.

**Spec:** `docs/superpowers/specs/2026-06-15-ascii-banner-default-preset-design.md`

**Conventions:** Tests are `.mjs` importing compiled output from `../dist/*.js`, asserting on calls to an injected/monkeypatched `console`. `pnpm test` builds then runs `node --test`. Single file: `pnpm run build && node --test test/<file>.mjs`. Source is ESM with explicit `.js` import specifiers.

**Important — ASCII constants:** The two banner strings contain backslashes, apostrophes, and (for `01.software`) a backtick. They MUST be stored as DOUBLE-QUOTED JS string literals exactly as given below (these are JSON-encoded, which is valid JS). Do not convert them to template literals.

---

### Task 1: `createBrandingBanner` factory + ASCII constants in `branding.ts`

**Files:**
- Modify: `src/branding.ts` (append; do not change existing `createBranding`/types)
- Test: `test/banner.test.mjs` (new)

- [ ] **Step 1: Write the failing test**

Create `test/banner.test.mjs`:
```js
import assert from "node:assert/strict";
import { test } from "node:test";

import { createBrandingBanner } from "../dist/branding.js";

function fakeConsole() {
  const calls = [];
  return {
    calls,
    group: (...a) => calls.push(["group", ...a]),
    groupEnd: (...a) => calls.push(["groupEnd", ...a]),
    info: (...a) => calls.push(["info", ...a]),
  };
}

test("banner prints captions, colored art, and urls via info with no console groups", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });

  // Exactly six info calls, nothing else.
  assert.equal(c.calls.length, 6);
  assert.ok(c.calls.every((call) => call[0] === "info"));

  // Captions are %c-styled and dim.
  assert.equal(c.calls[0][1], "%cWebsite by");
  assert.equal(c.calls[0][2], "color: #888888");
  assert.equal(c.calls[3][1], "%cPowered by");
  assert.equal(c.calls[3][2], "color: #888888");

  // Art lines are %c-styled with the brand colors.
  assert.match(c.calls[1][1], /^%c/);
  assert.match(c.calls[1][2], /#2563eb/);
  assert.match(c.calls[4][1], /^%c/);
  assert.match(c.calls[4][2], /#7c3aed/);

  // Plain clickable URLs.
  assert.equal(c.calls[2][1], "https://01.works");
  assert.equal(c.calls[5][1], "https://01.software");
});

test("banner shows at most once per instance", () => {
  const show = createBrandingBanner();
  const c = fakeConsole();
  show({ console: c });
  show({ console: c });
  assert.equal(c.calls.length, 6);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run build`
Expected: FAIL — `tsc` (or the import at test time) errors because `createBrandingBanner` does not exist in `src/branding.ts`.

- [ ] **Step 3: Append the implementation to `src/branding.ts`**

Add the following to the END of `src/branding.ts` (after the existing `createBranding` function; do NOT modify the existing types or `createBranding`):
```ts
/** Caption style: dim gray, sits above each banner. */
const CAPTION_STYLE = "color: #888888";
/** 01.works banner color (blue) + monospace to preserve alignment. */
const WORKS_STYLE = "font-family: monospace; color: #2563eb";
/** 01.software banner color (violet) + monospace. */
const SOFTWARE_STYLE = "font-family: monospace; color: #7c3aed";

// figlet "Standard" font output, hardcoded (zero runtime dependency).
// Double-quoted literals: the strings contain backslashes, apostrophes, and a
// backtick (01.software), so they must NOT be template literals.
const WORKS_ART =
  "   ___  _                    _        \n  / _ \\/ |_      _____  _ __| | _____ \n | | | | \\ \\ /\\ / / _ \\| '__| |/ / __|\n | |_| | |\\ V  V / (_) | |  |   <\\__ \\\n  \\___/|_(_)_/\\_/ \\___/|_|  |_|\\_\\___/";
const SOFTWARE_ART =
  "   ___  _              __ _                          \n  / _ \\/ |  ___  ___  / _| |___      ____ _ _ __ ___ \n | | | | | / __|/ _ \\| |_| __\\ \\ /\\ / / _` | '__/ _ \\\n | |_| | |_\\__ \\ (_) |  _| |_ \\ V  V / (_| | | |  __/\n  \\___/|_(_)___/\\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|";

type BrandBanner = {
  caption: string;
  art: string;
  style: string;
  link: string;
};

const DEFAULT_BANNERS: BrandBanner[] = [
  { caption: "Website by", art: WORKS_ART, style: WORKS_STYLE, link: "https://01.works" },
  { caption: "Powered by", art: SOFTWARE_ART, style: SOFTWARE_STYLE, link: "https://01.software" },
];

/**
 * Create the default 01.works branding printer: emphasized ASCII-art banners
 * (figlet "Standard"), each with a dim caption, brand-colored `%c` art, and the
 * plain URL — no console groups. Shows at most once per instance and is SSR-safe
 * (no `window` access, no import-time side effects).
 */
export function createBrandingBanner(): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) {
      return;
    }
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const banner of DEFAULT_BANNERS) {
      consoleTarget.info(`%c${banner.caption}`, CAPTION_STYLE);
      consoleTarget.info(`%c${banner.art}`, banner.style);
      consoleTarget.info(banner.link);
    }
  };
}
```

Note: the `` `%c${banner.caption}` `` template literals in the SOURCE only contain `%c` and `${…}` — they are safe. The backtick/backslash characters live inside the DATA constants (`WORKS_ART`/`SOFTWARE_ART`), which are double-quoted, so there is no escaping hazard in the template literals.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm run build && node --test test/banner.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/branding.ts test/banner.test.mjs
git commit -m "feat: add createBrandingBanner ASCII-art default preset renderer"
```

---

### Task 2: Repoint `showBranding` to the banner + update default-output tests

**Files:**
- Modify: `src/index.ts`
- Modify (full rewrite): `test/index.test.mjs`
- Modify: `test/package-smoke.test.mjs`

- [ ] **Step 1: Rewrite `test/index.test.mjs` (failing first)**

Replace the ENTIRE contents of `test/index.test.mjs` with:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm run build && node --test test/index.test.mjs`
Expected: FAIL — `showBranding` still uses `createBranding()` (groups), so it makes `group`/`groupEnd` calls and only 2 `info` calls. The new assertions (`groupCalls.length === 0`, `infoCalls.length === 6`, `%cWebsite by`) fail.

- [ ] **Step 3: Repoint `showBranding` in `src/index.ts`**

Replace the ENTIRE contents of `src/index.ts` with:
```ts
export * from "./core.js";
export * from "./logger.js";
export * from "./branding.js";

import { createBrandingBanner } from "./branding.js";

/** Show the default 01.works developer-console branding (once per instance). */
export const showBranding = createBrandingBanner();
```

- [ ] **Step 4: Run the index tests to verify they pass**

Run: `pnpm run build && node --test test/index.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Update the smoke test assertions**

In `test/package-smoke.test.mjs`, the `smokeScript` currently asserts two `info` calls equal to the two URLs. Replace this block:
```js
        assert.equal(calls.length, 2);
        assert.equal(calls[0]?.[0], "https://01.works");
        assert.equal(calls[1]?.[0], "https://01.software");
```
with:
```js
        assert.equal(calls.length, 6);
        const lines = calls.map((args) => args[0]);
        assert.ok(lines.includes("https://01.works"));
        assert.ok(lines.includes("https://01.software"));
```
Leave the rest of the smoke test (the injected console with `group`/`info`/`groupEnd`, the pack/install flow) unchanged — `group`/`groupEnd` remain provided but are now unused by the banner.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test`
Expected: PASS — full suite green. Count should be 20 (the previous 18, minus the 2 old index tests that were replaced by 2 new ones = still 18 in those files, plus the 2 new banner tests from Task 1 = 20). Report the actual count.

- [ ] **Step 7: Typecheck**

Run: `pnpm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/index.ts test/index.test.mjs test/package-smoke.test.mjs
git commit -m "feat: default branding now prints ASCII banners instead of groups"
```

---

### Task 3: Update README for the new default output

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the `showBranding` API description**

In `README.md`, under `### `showBranding(options?: BrandingOptions): void``, replace the line:
```markdown
Logs the 01.works branding message with `console.info`.
```
with:
```markdown
Logs the 01.works branding with `console.info`: emphasized ASCII-art banners for
`01.works` (blue) and `01.software` (violet), styled with the console's `%c`
formatting, each with a dim caption and its URL. No console groups are used.
```

- [ ] **Step 2: Verify**

Run: `pnpm test`
Expected: PASS (docs-only change; suite unaffected, still 20 green).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: describe ASCII banner default branding output"
```

---

## Self-Review

- **Spec coverage:** ASCII banners replace groups for the default (Task 2 repoint + Task 1 renderer) ✓; `%c` emphasis with brand colors + dim captions + plain URLs (Task 1 implementation + tests) ✓; hardcoded figlet constants, zero deps (Task 1 constants, flagged double-quoted) ✓; once-guard + SSR safety + `console` injection preserved (Task 1 `hasShown` closure / `info`-only / options.console) ✓; `createBranding`/React `groups`/core/logger untouched (only `branding.ts` appended, `index.ts` repoint; `branding.test.mjs`/`react.test.mjs` not modified) ✓; `BrandingOptions` unchanged, banner uses `info` only ✓; index + smoke tests updated, README updated (Tasks 2–3) ✓. Non-goals (runtime figlet, configurable banner, generic-factory change) respected.
- **Placeholder scan:** none — every code/test step shows full content; the ASCII constants are given verbatim.
- **Type consistency:** `createBrandingBanner` signature `(): (options?: BrandingOptions) => void` matches its use as `showBranding` in `index.ts`; `BrandBanner` fields (`caption`/`art`/`style`/`link`) are used consistently in `DEFAULT_BANNERS` and the render loop; constant names `WORKS_ART`/`SOFTWARE_ART`/`CAPTION_STYLE`/`WORKS_STYLE`/`SOFTWARE_STYLE` referenced exactly as defined; test expectations (6 info calls, indices 0/3 captions, 1/4 art-with-color, 2/5 urls) match the render order (caption, art, link per banner).
