# React `<Branding>` Configurable Props Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the React `Branding` component and `useBranding` hook accept configurable props (`groups`, plus the existing `console`) that mirror the core `createBranding` config, while preserving today's default-branding behavior and once-per-mount semantics.

**Architecture:** `src/react.tsx` gains a `BrandingProps = Partial<BrandingConfig> & BrandingOptions` type and a pure exported `resolveBrandingShow(groups?)` helper that returns the shared `showBranding` singleton when no `groups` are given, or a fresh `createBranding({ groups })` instance otherwise. `useBranding` holds that instance in a `useRef` (created once, StrictMode-safe) and runs it once on mount.

**Tech Stack:** TypeScript (NodeNext, strict), React 19 (peer), Node built-in test runner with `react-dom/server` for SSR assertions, pnpm.

**Spec:** `docs/superpowers/specs/2026-06-15-react-branding-props-design.md`

**Conventions:** Tests are `.mjs` importing compiled output from `../dist/*.js`. `pnpm test` builds then runs `node --test`. Single file: `pnpm run build && node --test test/react.test.mjs`. Source is ESM with explicit `.js` import specifiers; `tsconfig` has `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

**Starting point — current `src/react.tsx`:**
```tsx
"use client";

import { useEffect } from "react";

import { showBranding, type BrandingOptions } from "./index.js";

/**
 * React hook that shows the 01.works developer-console branding once, after the
 * component mounts.
 * ...
 */
export function useBranding(options: BrandingOptions = {}): void {
  useEffect(() => {
    showBranding(options);
  }, []);
}

export function Branding(options: BrandingOptions = {}): null {
  useBranding(options);
  return null;
}
```
Note: it currently imports `showBranding` and `BrandingOptions` from `./index.js`. This plan adds imports of `createBranding`, `BrandingConfig`, and `BrandingGroup`. `createBranding` and `BrandingConfig`/`BrandingGroup` are exported from `./branding.js` and re-exported by `./index.js`, so importing them from `./index.js` works.

---

### Task 1: `resolveBrandingShow` helper + `BrandingProps` type

**Files:**
- Modify: `src/react.tsx`
- Test: `test/react.test.mjs` (add tests; keep existing ones)

This task adds the pure show-resolution helper and the props type. It does NOT yet change `useBranding`/`Branding` runtime behavior (that is Task 2) — but it does widen their parameter type to `BrandingProps`, which is a backward-compatible superset of `BrandingOptions`.

- [ ] **Step 1: Write the failing tests**

Append these tests to `test/react.test.mjs` (keep the three existing tests as-is):
```js
import { createBranding, showBranding } from "../dist/index.js";

test("resolveBrandingShow without groups returns the shared showBranding singleton", async () => {
  const { resolveBrandingShow } = await import(moduleUrl);
  assert.equal(resolveBrandingShow(), showBranding);
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
```

Note: `moduleUrl` is already defined near the top of `test/react.test.mjs` as `new URL("../dist/react.js", import.meta.url)`. Add the `import { createBranding, showBranding } from "../dist/index.js";` line with the other imports at the top of the file (you may drop `createBranding` from the import if your linter flags it as unused — only `showBranding` is referenced — but importing both is harmless and documents intent). To be safe and lint-clean, import only what you use: `import { showBranding } from "../dist/index.js";`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm run build && node --test test/react.test.mjs`
Expected: FAIL — `resolveBrandingShow` is not exported (`undefined is not a function`), while the three existing tests still pass.

- [ ] **Step 3: Add the type and helper to `src/react.tsx`**

Update the import line:
```tsx
import {
  createBranding,
  showBranding,
  type BrandingConfig,
  type BrandingGroup,
  type BrandingOptions,
} from "./index.js";
```

Add, after the imports and before `useBranding`:
```tsx
/**
 * Props for {@link Branding} and {@link useBranding}. A superset of
 * {@link BrandingOptions} that also accepts the branding `groups` from
 * {@link BrandingConfig}, so custom branding can be configured via props.
 */
export type BrandingProps = Partial<BrandingConfig> & BrandingOptions;

/**
 * Pick the branding printer for the given props. Returns the shared
 * `showBranding` singleton when no `groups` are supplied (default 01.works,
 * shown once app-wide), or a fresh `createBranding({ groups })` instance for a
 * custom configuration. Exported for testing — prefer `<Branding>`.
 */
export function resolveBrandingShow(
  groups?: BrandingGroup[],
): (options?: BrandingOptions) => void {
  return groups ? createBranding({ groups }) : showBranding;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm run build && node --test test/react.test.mjs`
Expected: PASS — all five tests (three existing + two new) green.

- [ ] **Step 5: Commit**

```bash
git add src/react.tsx test/react.test.mjs
git commit -m "feat: add resolveBrandingShow helper and BrandingProps type"
```

---

### Task 2: Wire `useBranding`/`Branding` to props via a `useRef`-held instance

**Files:**
- Modify: `src/react.tsx`
- Test: `test/react.test.mjs` (extend SSR test for the custom-config path)

- [ ] **Step 1: Write the failing test**

Replace the existing `"Branding renders nothing and is SSR-safe"` test in `test/react.test.mjs` with this version, which also exercises a `groups` prop and asserts no server-side logging on either `info` or `group`:
```js
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
```

- [ ] **Step 2: Run the test to verify the current behavior**

Run: `pnpm run build && node --test test/react.test.mjs`
Expected: this updated SSR test PASSES even before the Task 2 implementation change, because `Branding(options)` currently ignores unknown props and still renders nothing / logs nothing during SSR. That is fine — it locks in SSR safety for the props path. Proceed to wire the runtime behavior so the props actually take effect on the client.

- [ ] **Step 3: Rewrite `useBranding` and `Branding` to use props + a ref-held instance**

Update the React import to include `useRef`:
```tsx
import { useEffect, useRef } from "react";
```

Replace the existing `useBranding` and `Branding` function bodies with:
```tsx
/**
 * React hook that shows developer-console branding once, after the component
 * mounts. With no `groups`, it shows the default 01.works branding via the
 * shared singleton (once app-wide). With `groups`, it builds a per-component
 * branding instance — held in a ref so it survives React StrictMode's dev
 * double-invoke — and shows it once per mount.
 *
 * SSR-safe: the effect only runs on the client, so server rendering produces no
 * branding side effect. The config is captured once on mount; later prop
 * changes are intentionally ignored (branding is a one-shot side effect).
 */
export function useBranding(props: BrandingProps = {}): void {
  const { console: consoleTarget, groups } = props;
  const showRef = useRef<((options?: BrandingOptions) => void) | null>(null);
  if (showRef.current === null) {
    showRef.current = resolveBrandingShow(groups);
  }
  useEffect(() => {
    showRef.current?.(consoleTarget ? { console: consoleTarget } : {});
    // Intentionally run once on mount — see the note above about idempotency.
  }, []);
}

/**
 * Renderless React component that shows developer-console branding once. Drop it
 * anywhere in the tree (typically the root layout) and it renders nothing.
 * Accepts the same props as {@link useBranding}.
 */
export function Branding(props: BrandingProps = {}): null {
  useBranding(props);
  return null;
}
```

Note on `exactOptionalPropertyTypes`: the `consoleTarget ? { console: consoleTarget } : {}` form is required — do not write `{ console: consoleTarget }` directly, because `consoleTarget` may be `undefined` and the strict flag forbids assigning `undefined` to an optional property.

- [ ] **Step 4: Run the full suite to verify everything passes**

Run: `pnpm test`
Expected: PASS — full suite green (the existing 16 plus the two new helper tests = 18; the SSR test was replaced, not added).

- [ ] **Step 5: Typecheck**

Run: `pnpm run typecheck`
Expected: no output, exit 0. (Confirms the `useRef` generic, `BrandingProps`, and the strict-optional `console` handling all typecheck.)

- [ ] **Step 6: Commit**

```bash
git add src/react.tsx test/react.test.mjs
git commit -m "feat: configure React Branding via groups/console props"
```

---

### Task 3: Document the `groups` prop in the README React section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a custom-config example to the React section**

In `README.md`, find the `## React` section. After the existing paragraph that introduces the `Branding` component (the one ending with "SSR-safe: nothing is logged during server rendering."), and before the `Prefer a hook?` paragraph, insert:

```markdown
Pass `groups` to show custom branding instead of the 01.works default (any
console target can still be injected with `console`):

​```tsx
<Branding groups={[{ label: "Website by", link: "https://acme.com" }]} />
​```

Both `Branding` and `useBranding` accept `BrandingProps` — the branding
`groups` plus an optional `console` target. With no `groups`, the default
01.works branding is shown once for the whole app; with `groups`, each mounted
component shows its configured branding once.
```

IMPORTANT: the two `​```tsx` / `​```` fences above are shown with a leading
zero-width marker only to avoid prematurely closing this plan's own code fence.
When editing `README.md`, write NORMAL triple backticks (```tsx … ```) with NO
zero-width character.

- [ ] **Step 2: Verify the README still reads correctly and tests pass**

Run: `pnpm test`
Expected: PASS (docs-only change; suite unaffected, still 18 green).

Manually confirm the new fenced block is valid ```tsx and that the surrounding
"Prefer a hook?" paragraph still follows it.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document configurable groups prop for React Branding"
```

---

## Self-Review

- **Spec coverage:** `BrandingProps` type (Task 1) ✓; default path reuses singleton / custom path builds instance (Task 1 helper + Task 2 wiring) ✓; `useRef`-held instance + once-on-mount + StrictMode safety (Task 2) ✓; config read once on mount (Task 2 empty-deps effect + ref lazy init) ✓; SSR safety for both paths (Task 2 SSR test) ✓; `resolveBrandingShow` exported pure helper + tests, including `=== showBranding` identity and custom-group emission (Task 1) ✓; existing tests preserved (Tasks 1–2) ✓; backward-compat superset type (Task 1) ✓; README `groups` prop docs (Task 3) ✓. Non-goals (no logger props, no runtime reconfig, no extra styling props) respected.
- **Placeholder scan:** none — every code/test step shows full content; the only intentional placeholder markers are the zero-width fence guards, explicitly flagged for removal.
- **Type consistency:** `BrandingProps`, `resolveBrandingShow`, `BrandingGroup`, `BrandingConfig`, `BrandingOptions`, `showBranding`, `createBranding` are used identically across tasks; `resolveBrandingShow(groups?)` signature in Task 1 matches its call in Task 2; the `useRef<((options?: BrandingOptions) => void) | null>` type matches `resolveBrandingShow`'s return type.
