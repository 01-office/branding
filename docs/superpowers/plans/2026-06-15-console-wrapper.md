# `@01.works/console` Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize the 01.works-only branding package into a lightweight, dependency-free browser-console expression wrapper (`%c` styling + badges + level logger), with 01.works branding kept as the zero-config default preset.

**Architecture:** A pure `core.ts` style-segment primitive assembles `%c` format strings; `logger.ts` builds level methods on top of it; `branding.ts` reimplements `showBranding` via a `createBranding(config)` factory whose default config reproduces today's exact output. `index.ts` re-exports all three; `react.tsx` is unchanged. Package and repo rename `branding` → `console`.

**Tech Stack:** TypeScript (NodeNext, strict), Node's built-in test runner (`node --test`, `.mjs` tests importing from `dist/`), pnpm.

**Spec:** `docs/superpowers/specs/2026-06-15-console-wrapper-design.md`

**Conventions to follow (from existing code):**
- Tests are `.mjs` under `test/`, import compiled output from `../dist/*.js`, and assert on calls to an injected/monkeypatched `console`.
- `pnpm test` runs `pnpm run build` then `node --test --test-concurrency=1`. To run one file: `pnpm run build && node --test test/<file>.mjs`.
- Source uses ESM with explicit `.js` import specifiers (NodeNext), `export`ed named functions/types, and JSDoc on public functions.

---

### Task 1: Rename package and repo references to `@01.works/console`

**Files:**
- Modify: `package.json` (name, repository.url, bugs.url, homepage)
- Modify: `README.md` (title, install path, import specifiers)
- Modify: `test/package-smoke.test.mjs` (import specifier + temp dir prefix)

- [ ] **Step 1: Update `package.json` identity fields**

In `package.json` change:
```json
  "name": "@01.works/console",
```
and the repository/bugs/homepage block:
```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/01-office/console.git"
  },
  "bugs": {
    "url": "https://github.com/01-office/console/issues"
  },
  "homepage": "https://github.com/01-office/console#readme",
```
Leave `version` at `0.1.0`. Do not touch `exports` yet (Task 5).

- [ ] **Step 2: Update the smoke test to the new name**

In `test/package-smoke.test.mjs`:
- Change the temp dir prefix from `"branding-smoke-"` to `"console-smoke-"`.
- Change the import inside `smokeScript` from `@01.works/branding` to `@01.works/console`:
```js
      import { showBranding } from "@01.works/console";
```
Leave all assertions (`https://01.works`, `https://01.software`, `calls.length === 2`) unchanged — output must not change.

- [ ] **Step 3: Update README name, install, and import paths**

In `README.md`:
- Title: `# @01.works/console`
- Install commands: `pnpm add github:01-office/console` and `pnpm add @01.works/console`.
- Every import in usage examples: `from "@01.works/console"` and `from "@01.works/console/react"`.
Do not add new-API docs yet — that is Task 5.

- [ ] **Step 4: Run the full test suite to verify the rename is consistent**

Run: `pnpm test`
Expected: PASS (all existing tests green; the smoke test now installs `@01.works/console` and still asserts the two default links).

- [ ] **Step 5: Commit**

```bash
git add package.json README.md test/package-smoke.test.mjs
git commit -m "refactor: rename package and repo to @01.works/console"
```

---

### Task 2: `core.ts` — style-segment primitive

**Files:**
- Create: `src/core.ts`
- Test: `test/core.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/core.test.mjs`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run build`
Expected: FAIL — `tsc` errors because `src/core.ts` does not exist / `dist/core.js` is missing.

- [ ] **Step 3: Write the minimal implementation**

Create `src/core.ts`:
```ts
/** A CSS object (camelCase keys) or a raw CSS declaration string. */
export type ConsoleStyle = Partial<CSSStyleDeclaration> | string;

/** A piece of styled console text. */
export type Segment = {
  readonly text: string;
  readonly css: string;
};

/** Minimal console surface needed to emit a styled line. */
export type LogConsole = Pick<Console, "log">;

/** A part of a styled line: either a styled Segment or a plain string. */
export type Part = Segment | string;

/** The assembled `%c` format string and its paired style strings. */
export type Assembled = {
  readonly format: string;
  readonly styles: string[];
};

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function toCss(style?: ConsoleStyle): string {
  if (!style) {
    return "";
  }
  if (typeof style === "string") {
    return style;
  }
  return Object.entries(style)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${camelToKebab(key)}: ${String(value)}`)
    .join("; ");
}

function isSegment(part: Part): part is Segment {
  return typeof part === "object" && part !== null && "text" in part;
}

/** Build an arbitrary styled segment. */
export function segment(text: string, style?: ConsoleStyle): Segment {
  return { text, css: toCss(style) };
}

/** Build a styled label segment with sensible default badge styling. */
export function badge(label: string, style?: ConsoleStyle): Segment {
  const base = "padding: 2px 6px; border-radius: 4px; font-weight: 600;";
  const extra = toCss(style);
  return { text: label, css: extra ? `${base} ${extra}` : base };
}

/** Assemble parts into a `%c` format string plus matching style strings. */
export function assemble(parts: Part[]): Assembled {
  let format = "";
  const styles: string[] = [];
  for (const part of parts) {
    if (isSegment(part)) {
      format += `%c${part.text}%c`;
      styles.push(part.css, "");
    } else {
      format += part;
    }
  }
  return { format, styles };
}

/**
 * Emit assembled `parts` as a single console.log call on `consoleTarget`, with
 * any `rest` arguments appended raw (so objects keep their interactive inspect).
 * No-op when the target has no `log`.
 */
export function emit(
  consoleTarget: LogConsole | undefined,
  parts: Part[],
  ...rest: unknown[]
): void {
  if (!consoleTarget?.log) {
    return;
  }
  const { format, styles } = assemble(parts);
  consoleTarget.log(format, ...styles, ...rest);
}

/** Convenience: emit styled parts to the global console. */
export function log(...parts: Part[]): void {
  emit(globalThis.console, parts);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm run build && node --test test/core.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core.ts test/core.test.mjs
git commit -m "feat: add core console style-segment primitive"
```

---

### Task 3: `logger.ts` — level logger

**Files:**
- Create: `src/logger.ts`
- Test: `test/logger.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/logger.test.mjs`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run build`
Expected: FAIL — `dist/logger.js` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `src/logger.ts`:
```ts
import { badge, emit, type ConsoleStyle, type LogConsole } from "./core.js";

export type Level = "info" | "warn" | "error" | "success" | "debug";

export type LoggerOptions = {
  /** Console target to emit to. Defaults to the global console. */
  console?: LogConsole;
  /** Per-level style overrides (CSS object or string). */
  levels?: Partial<Record<Level, ConsoleStyle>>;
};

export type Logger = Record<Level, (...args: unknown[]) => void>;

const LEVELS: readonly Level[] = ["info", "warn", "error", "success", "debug"];

const DEFAULT_LEVEL_STYLES: Record<Level, string> = {
  info: "background: #2563eb; color: #fff;",
  warn: "background: #d97706; color: #fff;",
  error: "background: #dc2626; color: #fff;",
  success: "background: #16a34a; color: #fff;",
  debug: "background: #6b7280; color: #fff;",
};

/**
 * Create a level logger. Each level prints a colored badge (the level name,
 * uppercased) followed by the raw arguments, so objects keep their interactive
 * console inspection.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const consoleTarget = options.console ?? globalThis.console;
  const logger = {} as Logger;
  for (const level of LEVELS) {
    const style = options.levels?.[level] ?? DEFAULT_LEVEL_STYLES[level];
    logger[level] = (...args: unknown[]) => {
      emit(consoleTarget, [badge(level.toUpperCase(), style)], ...args);
    };
  }
  return logger;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm run build && node --test test/logger.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/logger.ts test/logger.test.mjs
git commit -m "feat: add level logger built on core primitive"
```

---

### Task 4: `branding.ts` — `createBranding` factory + `showBranding` default

**Files:**
- Create: `src/branding.ts`
- Modify: `src/index.ts` (replace inline branding with re-exports)
- Test: `test/branding.test.mjs`

This moves the branding logic out of `index.ts` into `branding.ts` behind a `createBranding(config)` factory. `showBranding` becomes the default-config instance, producing byte-for-byte the same output. The existing `test/index.test.mjs` (which imports `showBranding` from `dist/index.js`) must keep passing unchanged.

- [ ] **Step 1: Write the failing test**

Create `test/branding.test.mjs`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm run build`
Expected: FAIL — `dist/branding.js` does not exist.

- [ ] **Step 3: Create `src/branding.ts`**

Create `src/branding.ts`:
```ts
export type BrandingOptions = {
  console?: Pick<Console, "group" | "groupEnd" | "info">;
};

/** A single labeled link group shown in the console. */
export type BrandingGroup = {
  label: string;
  link: string;
};

/** Configuration describing which groups a branding instance prints. */
export type BrandingConfig = {
  groups: BrandingGroup[];
};

const DEFAULT_CONFIG: BrandingConfig = {
  groups: [
    { label: "Website by", link: "https://01.works" },
    { label: "Powered by", link: "https://01.software" },
  ],
};

/**
 * Create a branding printer for the given config. The returned function shows
 * the branding at most once per instance and is SSR-safe (no `window` access,
 * no import-time side effects).
 */
export function createBranding(
  config: BrandingConfig = DEFAULT_CONFIG,
): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) {
      return;
    }
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const group of config.groups) {
      consoleTarget.group(group.label);
      consoleTarget.info(group.link);
      consoleTarget.groupEnd();
    }
  };
}

/** Show the default 01.works developer-console branding (once per instance). */
export const showBranding = createBranding();
```

- [ ] **Step 4: Replace `src/index.ts` with re-exports**

Replace the entire contents of `src/index.ts` with:
```ts
export * from "./core.js";
export * from "./logger.js";
export * from "./branding.js";
```

Note: `react.tsx` imports `{ showBranding, type BrandingOptions } from "./index.js"` — both are still exported (via `./branding.js`), so `react.tsx` needs no change.

- [ ] **Step 5: Run the affected tests to verify they pass**

Run: `pnpm run build && node --test test/branding.test.mjs test/index.test.mjs test/react.test.mjs`
Expected: PASS — new branding tests pass AND the existing `index`/`react` tests still pass (output unchanged).

- [ ] **Step 6: Commit**

```bash
git add src/branding.ts src/index.ts test/branding.test.mjs
git commit -m "refactor: extract createBranding factory, re-export core/logger/branding"
```

---

### Task 5: Wire `./logger` export, document the new API, full verification

**Files:**
- Modify: `package.json` (add `./logger` export subpath)
- Modify: `README.md` (new core/logger API sections)

- [ ] **Step 1: Add the `./logger` export subpath**

In `package.json` `exports`, add after the `./react` entry:
```json
    "./logger": {
      "types": "./dist/logger.d.ts",
      "import": "./dist/logger.js",
      "default": "./dist/logger.js"
    }
```
(`core` and `branding` are re-exported from `.`, so no extra subpaths are needed.)

- [ ] **Step 2: Add new-API docs to `README.md`**

Under the existing `## API` material, add a section documenting the console wrapper. Insert this Markdown (keep the existing branding/React sections intact):
```markdown
## Console styling

The package is a lightweight wrapper for styled browser-console output. The
01.works branding above is the default preset built on these primitives.

```ts
import { badge, log, segment } from "@01.works/console";

log(badge("API", { background: "#0af", color: "#fff" }), " request sent");
log(segment("hello", "color: hotpink; font-weight: 600"));
```

- `segment(text, style?)` — styled text. `style` is a CSS object (camelCase
  keys) or a raw CSS string.
- `badge(label, style?)` — a styled label with default padding/rounding.
- `log(...parts)` — emit styled parts (and plain strings) to the global console.

### Level logger

```ts
import { createLogger } from "@01.works/console/logger";

const logger = createLogger();
logger.info("loaded");
logger.success("saved");
logger.error("failed", err); // extra args keep interactive inspection
```

`createLogger(options?)` accepts `{ console, levels }` to inject a console
target and override per-level styles. Levels: `info`, `warn`, `error`,
`success`, `debug`.

### Custom branding

```ts
import { createBranding } from "@01.works/console";

const show = createBranding({
  groups: [{ label: "Website by", link: "https://acme.com" }],
});
show();
```

`createBranding(config)` returns a once-guarded, SSR-safe `show()` function.
`showBranding()` is the default 01.works instance.
```

- [ ] **Step 3: Run the full suite and packaging checks**

Run: `pnpm test`
Expected: PASS — all test files green (`core`, `logger`, `branding`, `index`, `react`, `package-smoke`).

Run: `pnpm run typecheck`
Expected: no output, exit 0.

Run: `pnpm pack --dry-run`
Expected: succeeds; tarball lists `dist/` (including `core.*`, `logger.*`, `branding.*`, `index.*`, `react.*`), `README.md`, `LICENSE`.

- [ ] **Step 4: Commit**

```bash
git add package.json README.md
git commit -m "feat: expose ./logger export and document console wrapper API"
```

---

### Task 6 (operational, do last, confirm before running): Rename the GitHub repository

This is an outward-facing action — **confirm with the maintainer before running.**

- [ ] **Step 1: Rename the repo on GitHub**

Run: `gh repo rename console --repo 01-office/branding`
Expected: GitHub renames `01-office/branding` → `01-office/console` and sets up a redirect. Then update the local remote if needed:
```bash
git remote set-url origin https://github.com/01-office/console.git
```

- [ ] **Step 2: Verify**

Run: `git remote -v`
Expected: `origin` points at `…/01-office/console.git`. (The `package.json` URLs were already updated in Task 1.)

---

## Self-Review

- **Spec coverage:** rename (Task 1, 5, 6) ✓; core `%c`+badge+segment+log (Task 2) ✓; level logger (Task 3) ✓; `createBranding`/default `showBranding` + SSR/once guard (Task 4) ✓; module layout `core/logger/branding/index/react` (Tasks 2–4) ✓; `./logger` export + README migration/API docs (Tasks 1, 5) ✓; backward-compat of existing public API/output (Task 4 keeps `index.test`/`react.test` green; Task 1 keeps smoke output) ✓; tests with injected console (every task) ✓. Non-goals (table/banner/image/ANSI) correctly excluded.
- **Placeholder scan:** none — every code/test step shows full content.
- **Type consistency:** `Segment`, `Part`, `ConsoleStyle`, `LogConsole`, `Assembled` defined in `core.ts` (Task 2) and reused in `logger.ts` (Task 3); `assemble`/`emit`/`badge`/`segment`/`log` names consistent across Tasks 2–3; `BrandingOptions`/`BrandingConfig`/`BrandingGroup`/`createBranding`/`showBranding` consistent in Task 4 and re-exported by `index.ts`; `react.tsx` import surface (`showBranding`, `BrandingOptions`) preserved.
