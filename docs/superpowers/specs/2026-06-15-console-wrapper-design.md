# Design: `@01.works/console` — lightweight console expression wrapper

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan

## Summary

Generalize the existing `@01.works/branding` package — currently a 01.works-only
developer-console branding utility — into a lightweight, dependency-free wrapper
that makes the browser console easy to style and express in varied ways. The
existing 01.works branding becomes the **default preset** built on top of the new
primitives: calling `showBranding()` with no arguments produces exactly the
output it does today.

The package is renamed `@01.works/branding` → **`@01.works/console`**, and the
git repository is renamed `01-office/branding` → **`01-office/console`** to match.

## Goals

- Provide a small, tree-shakeable, SSR-safe API for styled browser-console output.
- Keep 100% backward compatibility of the existing public surface
  (`showBranding`, `BrandingOptions`, `Branding`, `useBranding`) and its output.
- Make the 01.works branding the zero-config default, while letting other
  projects build their own branding/loggers on the same engine.

## Non-Goals (YAGNI)

- `console.table` / structured-data helpers.
- Multi-line banners / ASCII art.
- Console image rendering (`%c` background trick).
- Terminal/ANSI color output. The library is **browser-console first**; on the
  server it degrades to plain text (no styles), it does not emit ANSI codes.

These can be added later if real demand appears; they are excluded from the
first release to keep the core small.

## Scope of "varied expression" (chosen)

1. **`%c` styling** — apply CSS (color/background/font/padding) to console text.
2. **Badges/labels** — colored tag prefixes like `[API]`.
3. **Level logger** — `info` / `warn` / `error` / `success` / `debug` presets.

(Groups are used internally by the branding preset; not a public primitive.)

## Architecture

### Module layout

```
src/
  core.ts      — style-segment primitive: build %c format strings + CSS
  logger.ts    — createLogger: level methods with preset styles
  branding.ts  — showBranding (default = 01.works) + createBranding(config)
  index.ts     — re-exports core + logger + branding
  react.tsx    — Branding / useBranding (unchanged behavior, uses branding.ts)
```

`package.json` exports expose `.`, `./react`, and `./logger` subpaths to aid
tree-shaking.

### Unit responsibilities

- **core.ts** — pure, no side effects. Owns how a styled segment is represented
  and how a list of segments is assembled into a single `console`-compatible
  call: a format string with `%c` markers plus the matching CSS string array.
  - `type ConsoleStyle = Partial<CSSStyleDeclaration> | string` (CSS object or
    raw CSS text).
  - `badge(label: string, style?: ConsoleStyle): Segment` — a styled label
    segment.
  - `segment(text: string, style?: ConsoleStyle): Segment` — arbitrary styled
    text.
  - `log(...parts: Array<Segment | string>): void` — assemble and emit via the
    target console. Plain strings pass through unstyled.
  - Internal `assemble(parts)` returns `{ format, styles }` so it can be unit
    tested without a real console.
  - SSR-safe: on a non-browser target it still works; styling is applied through
    the standard `%c` mechanism, which is harmless in Node (just ignored).

- **logger.ts** — `createLogger(opts?)` returns an object with
  `info/warn/error/success/debug` methods. Each level has a default badge +
  style; `opts` may override the console target and per-level styles. Built on
  `core.ts` primitives.
  - `opts.console?: Pick<Console, "log">` (injectable for tests/custom targets).
  - `opts.levels?: Partial<Record<Level, ConsoleStyle>>` to override styles.

- **branding.ts** — `createBranding(config)` returns a `show()` function that is
  once-guarded and SSR-safe. `showBranding` is `createBranding(DEFAULT_01WORKS)`.
  - `config` describes the groups to print (label + link), defaulting to the
    current two groups: `Website by → https://01.works`,
    `Powered by → https://01.software`.
  - Preserves `BrandingOptions` (`console?: Pick<Console, "group"|"groupEnd"|"info">`)
    and the once-per-module-instance guard.

- **react.tsx** — unchanged public behavior. `Branding` (renderless) and
  `useBranding` show branding once after mount, SSR-safe, `"use client"`.

## Data flow

`badge()/segment()` produce `Segment` objects → `log()` (or a `logger` level
method) calls `assemble()` → emits one `console.log` call with a `%c` format
string and CSS array. `showBranding()` walks its config groups and emits
`group`/`info`/`groupEnd` calls (as today), guarded so it runs at most once.

## Error handling

- All entry points are SSR-safe: no `window` access, no import-time side effects.
- `log`/logger fall back to `globalThis.console` when no target is injected; if
  `console` is absent, calls are no-ops (guard before invoking).
- Invalid/empty styles are treated as unstyled rather than throwing.

## Backward compatibility

The existing public API and its console output are preserved exactly. New API is
purely additive. No major version bump required for behavior; the **package and
repository rename** (`branding` → `console`) is the only breaking change,
mitigated by the package being at `0.1.0` and effectively unpublished.

Migration notes captured in README: install path and import specifier change
from `@01.works/branding` (`github:01-office/branding`) to `@01.works/console`
(`github:01-office/console`). `package.json` `name`, `repository.url`, `bugs.url`,
and `homepage` are all updated to the new repo.

## Testing

Keep the existing three tests (`index`, `react`, `package-smoke`), updated for
the new package name where needed, plus add:

- **core** — `assemble()` builds correct `%c` format + CSS array; plain strings
  pass through; CSS object vs string both supported.
- **logger** — each level calls the injected console with the expected
  badge/style; style overrides apply.
- **branding** — `createBranding(customConfig)` emits the configured groups;
  `showBranding()` still emits the exact default 01.works output; once-guard
  holds across repeated calls.

All tests inject a fake `console` and assert on call arguments.

## Open questions

None blocking. The GitHub repository rename (`gh repo rename console`) and npm
publish under the new name are operational steps executed outside the code
changes; the code/docs in this repo are updated to assume the new name.
