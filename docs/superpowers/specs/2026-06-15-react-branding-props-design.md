# Design: configurable props for React `<Branding>` / `useBranding`

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan
**Builds on:** `docs/superpowers/specs/2026-06-15-console-wrapper-design.md`

## Summary

The React entry (`src/react.tsx`) currently exposes `Branding` and `useBranding`
that accept only `BrandingOptions` (`{ console? }`) and always show the default
01.works branding via the module singleton `showBranding`. This change makes the
React props mirror the core `createBranding(config)` surface, so a custom
branding can be configured directly through props — consistent with how the
function API is configured.

## Goals

- React props expose the same configuration as `createBranding`: the branding
  `groups`, plus the existing `console` target.
- `<Branding />` / `<Branding console={...} />` (no `groups`) behave exactly as
  today — default 01.works branding, shown once for the whole app.
- A custom-config `<Branding groups={...} />` shows once per mounted component
  and is React StrictMode-safe (no double log on the dev double-invoke).

## Non-Goals (YAGNI)

- No logger (`createLogger`) props — the logger is not a React component.
- No runtime reconfiguration: branding shows once on mount; props read after the
  first show are intentionally ignored.
- No new styling props beyond what `BrandingConfig` already carries (`groups`).

## Props

```ts
import type { BrandingConfig, BrandingGroup, BrandingOptions } from "./branding.js";

export type BrandingProps = Partial<BrandingConfig> & BrandingOptions;
// resolves to:
//   { groups?: BrandingGroup[]; console?: Pick<Console, "group" | "groupEnd" | "info"> }
```

- `groups` omitted → default 01.works preset.
- `groups` provided → custom branding for this component.
- `console` → inject a console target (unchanged from today).

## Behavior

```tsx
export function useBranding(props: BrandingProps = {}): void {
  const { console: consoleTarget, groups } = props;
  const showRef = useRef<((options?: BrandingOptions) => void) | null>(null);
  if (showRef.current === null) {
    showRef.current = groups ? createBranding({ groups }) : showBranding;
  }
  useEffect(() => {
    showRef.current?.(consoleTarget ? { console: consoleTarget } : {});
    // Run once on mount. The branding instance + config are captured here.
  }, []);
}

export function Branding(props: BrandingProps = {}): null {
  useBranding(props);
  return null;
}
```

- **No `groups`** → reuse the module singleton `showBranding`. The app shows the
  default branding once total (current behavior preserved).
- **`groups` provided** → build a per-component `createBranding({ groups })`
  instance, held in a `useRef` so it is created once and survives the StrictMode
  dev double-invoke (same fiber → ref preserved → the instance's own once-guard
  blocks the second call). The branding shows once per genuine mount.
- **Config is read once at mount.** Changing `groups` after first show is a
  no-op by design (branding is a one-shot side effect).

## SSR safety

Unchanged: the effect only runs on the client, so server rendering produces no
branding for either the default or custom-config path. `react.tsx` keeps its
`"use client"` directive and is import-side-effect-free.

## Testing

The repo runs tests in Node with no DOM/jsdom, so React effects do not execute
under test. To keep the new logic verifiable, the pure show-resolution is a
small exported helper:

```tsx
/** Pick the branding printer for the given props. Exported for testing. */
export function resolveBrandingShow(
  groups?: BrandingGroup[],
): (options?: BrandingOptions) => void {
  return groups ? createBranding({ groups }) : showBranding;
}
```

Tests (in `test/react.test.mjs`, importing from `dist/react.js`):

- `resolveBrandingShow()` (no groups) returns the exact `showBranding` singleton
  (`assert.equal(resolveBrandingShow(), showBranding)`), so the default path is
  unchanged and app-wide once-guarded.
- `resolveBrandingShow([{ label, link }])` returns a function that, called with
  an injected `console`, emits the configured group(s) — `group(label)`,
  `info(link)`, `groupEnd()`.
- Existing tests stay: `Branding`/`useBranding` exported; `<Branding>` renders
  `""` and logs nothing during SSR; the entry ships `"use client"`. Extend the
  SSR test to also pass a `groups` prop and assert still no server log.

## Backward compatibility

`BrandingProps = Partial<BrandingConfig> & BrandingOptions` is a superset of the
old `BrandingOptions` prop, so every existing usage (`<Branding />`,
`<Branding console={...} />`, `useBranding(options)`) compiles and behaves
identically. The default branding still routes through the shared singleton.

## Affected files

- `src/react.tsx` — `BrandingProps` type, `resolveBrandingShow` helper, updated
  `useBranding`/`Branding` using a `useRef`-held instance.
- `test/react.test.mjs` — helper tests + SSR-with-config assertion.
- `README.md` — document the `groups` prop in the React section.

## Open questions

None.
