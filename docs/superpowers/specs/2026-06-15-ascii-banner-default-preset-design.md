# Design: ASCII-art banner for the default branding preset

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan
**Builds on:** `docs/superpowers/specs/2026-06-15-console-wrapper-design.md`,
`docs/superpowers/specs/2026-06-15-react-branding-props-design.md`

## Summary

Replace the default branding output. Today `showBranding()` prints two
`console.group` blocks ("Website by" → https://01.works, "Powered by" →
https://01.software). The new default drops console groups entirely and prints
two emphasized ASCII-art banners (figlet "Standard" font) for `01.works` and
`01.software`, each styled with a brand color via `%c` and accompanied by a dim
caption and the plain URL.

The generic `createBranding({ groups })` factory — used for custom branding and
by the React `groups` prop — is **unchanged** (it keeps its `console.group`
based, labeled-link rendering). Only the default preset gets the banner.

## Goals

- Default `showBranding()` shows ASCII-art banners, no `console.group`.
- Emphasis via `%c`: `01.works` blue (`#2563eb`), `01.software` violet
  (`#7c3aed`), monospace to preserve alignment; dim captions; plain URLs.
- Keep zero runtime dependencies — banners are hardcoded string constants (no
  runtime figlet).
- Preserve once-per-instance guard, SSR safety, and `console` injection.
- Leave `createBranding`, the React `groups` prop, and their tests/docs intact.

## Non-Goals (YAGNI)

- No runtime figlet/font generation.
- No configurability of the banner content (it is the fixed 01.works brand).
- No change to the generic `createBranding({ groups })` rendering.
- No new console methods on `BrandingOptions` — the banner uses `info` only.

## Output

For each brand, three `console.info` calls, in order, with no group/groupEnd:

```
%cWebsite by              caption,  style "color: #888888"
%c<01.works ASCII art>    banner,   style "font-family: monospace; color: #2563eb"
https://01.works          url,      plain string (clickable)

%cPowered by              caption,  style "color: #888888"
%c<01.software ASCII art> banner,   style "font-family: monospace; color: #7c3aed"
https://01.software       url,      plain string
```

Total: 6 `info` calls. The banners render colored in the browser console; in a
plain terminal the `%c`+style degrade to the raw ASCII text (harmless).

### Hardcoded ASCII constants

Exact figlet "Standard" output, stored as JS string literals (these are the
JSON-encoded forms, which are valid JS double-quoted string literals):

- `WORKS_ART`:
  `"   ___  _                    _        \n  / _ \\/ |_      _____  _ __| | _____ \n | | | | \\ \\ /\\ / / _ \\| '__| |/ / __|\n | |_| | |\\ V  V / (_) | |  |   <\\__ \\\n  \\___/|_(_)_/\\_/ \\___/|_|  |_|\\_\\___/"`
- `SOFTWARE_ART`:
  `"   ___  _              __ _                          \n  / _ \\/ |  ___  ___  / _| |___      ____ _ _ __ ___ \n | | | | | / __|/ _ \\| |_| __\\ \\ /\\ / / _\` | '__/ _ \\\n | |_| | |_\\__ \\ (_) |  _| |_ \\ V  V / (_| | | |  __/\n  \\___/|_(_)___/\\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|"`

(Note `SOFTWARE_ART` contains a backtick, so it must be a double-quoted string,
not a template literal.)

## Architecture

A dedicated banner renderer lives in `src/branding.ts`, separate from the
generic `createBranding`:

```ts
const CAPTION_STYLE = "color: #888888";
const WORKS_STYLE = "font-family: monospace; color: #2563eb";
const SOFTWARE_STYLE = "font-family: monospace; color: #7c3aed";

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
 * Create the default 01.works branding printer: emphasized ASCII-art banners,
 * once per instance, SSR-safe, no console groups.
 */
export function createBrandingBanner(): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) return;
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const b of DEFAULT_BANNERS) {
      consoleTarget.info(`%c${b.caption}`, CAPTION_STYLE);
      consoleTarget.info(`%c${b.art}`, b.style);
      consoleTarget.info(b.link);
    }
  };
}
```

- `showBranding` becomes `createBrandingBanner()`, still **defined in
  `src/index.ts`** (so the per-test cache-busting that re-imports only
  `index.js` gets a fresh once-guard closure, as established previously).
- `createBranding(config)` and `BrandingConfig`/`BrandingGroup`/`BrandingOptions`
  are unchanged. `BrandingOptions` still includes `group`/`groupEnd` (used by the
  generic factory) and `info` (used by both); the banner only calls `info`.

## Backward compatibility & ripple

- **Default output changes** — this is the intended behavior change. Anything
  asserting the old group-based default must update.
- `createBranding({ groups })`, the React `Branding`/`useBranding` `groups`
  prop, `resolveBrandingShow`, and the core/logger primitives are untouched.
- The React default path still calls `showBranding` (now the banner) via
  `resolveBrandingShow(undefined)`; `resolveBrandingShow() === showBranding`
  still holds. SSR safety is preserved (the banner runs only in the client
  effect). The custom `groups` path is unaffected.

## Testing

- **`test/branding.test.mjs`** (unchanged) still covers `createBranding`
  (generic groups) — verify it stays green.
- **`test/index.test.mjs`** — rewrite the default-output assertions:
  - `showBranding()` makes no `group`/`groupEnd` calls.
  - It makes 6 `info` calls: for each brand a `%c`-caption, a `%c`-art, and a
    plain URL. Assert by structure: the URLs `https://01.works` and
    `https://01.software` appear as plain `info` args; the caption args start
    with `%cWebsite by` / `%cPowered by` and carry `CAPTION_STYLE`; the two art
    args carry styles matching `/#2563eb/` and `/#7c3aed/` respectively.
  - Once-guard: calling `showBranding()` twice still yields only 6 `info` calls.
  - Custom `console` target: injected target receives the calls; global console
    untouched.
- **`test/package-smoke.test.mjs`** — update assertions: collect `info` args;
  assert the two URLs are present among them and that there are 6 `info` calls
  (the injected `group`/`groupEnd` remain provided but unused).
- **`test/react.test.mjs`** — unchanged; the default SSR no-log assertion still
  holds (banner runs only on the client).

## Affected files

- `src/branding.ts` — ASCII constants, styles, `BrandBanner`,
  `DEFAULT_BANNERS`, `createBrandingBanner`.
- `src/index.ts` — `showBranding = createBrandingBanner()` (was
  `createBranding()`).
- `test/index.test.mjs`, `test/package-smoke.test.mjs` — updated default-output
  assertions.
- `README.md` — describe the new default banner output.

## Open questions

None.
