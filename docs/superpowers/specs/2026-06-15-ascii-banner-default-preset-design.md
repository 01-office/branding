# Design: ASCII-art banner for the default branding preset

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan
**Builds on:** `docs/superpowers/specs/2026-06-15-console-wrapper-design.md`,
`docs/superpowers/specs/2026-06-15-react-branding-props-design.md`

## Summary

Replace the default branding output. Today `showBranding()` prints two
`console.group` blocks ("Website by" → https://01.works, "Powered by" →
https://01.software). The new default drops console groups entirely and prints,
**per brand, one combined `console.info` log**: the caption, an ASCII-art
wordmark (figlet "Standard") for `01.works` and `01.software`, then the URL
right-aligned on the line below the art. Rendered in monospace via a single `%c`
style (no color) so the right-aligned URL stays flush; the bare URL is
auto-linked by the browser console.

> Evolution note: an earlier iteration of this design used per-line `%c` brand
> colors (blue/violet) and six separate `info` calls (caption / art / URL per
> brand). The final design — captured below — collapses each brand to one log,
> right-aligns the URL, and uses monospace only (no color).

The generic `createBranding({ groups })` factory — used for custom branding and
by the React `groups` prop — is **unchanged** (it keeps its `console.group`
based, labeled-link rendering). Only the default preset gets the banner.

## Goals

- Default `showBranding()` shows ASCII-art banners, no `console.group`.
- One combined `console.info` log per brand: caption, ASCII art, then the URL
  right-aligned on the line below the art. Monospace via a single `%c` style, no
  color, so the right-aligned URL stays flush.
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

For each brand, ONE `console.info` call (two total), no group/groupEnd. Each call
is `info("%c" + content, "font-family: monospace")`, where `content` is the
caption, the ASCII art, then the URL right-aligned beneath the art:

```
Website by
   ___  _                    _
  / _ \/ |_      _____  _ __| | _____
 ...
                      https://01.works

Powered by
   ___  _              __ _
 ...
                                  https://01.software
```

Total: 2 `info` calls. Monospace (no color) keeps the right-aligned URL flush;
the bare URL is auto-linked by the browser console. In a plain terminal the
leading `%c`+style degrade harmlessly to raw text.

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
// Monospace only (no color): keeps the right-aligned URL flush with the banner.
const MONO_STYLE = "font-family: monospace";

type BrandBanner = {
  caption: string;
  art: string;
  link: string;
};

const DEFAULT_BANNERS: BrandBanner[] = [
  { caption: "Website by", art: WORKS_ART, link: "https://01.works" },
  { caption: "Powered by", art: SOFTWARE_ART, link: "https://01.software" },
];

// Caption on its own line, then art, then the URL right-aligned below the art.
function formatBanner(banner: BrandBanner): string {
  const artWidth = Math.max(...banner.art.split("\n").map((l) => l.length));
  const width = Math.max(artWidth, banner.caption.length, banner.link.length);
  const linkPad = " ".repeat(width - banner.link.length);
  return `${banner.caption}\n${banner.art}\n${linkPad}${banner.link}`;
}

/**
 * Create the default 01.works branding printer: one combined info log per brand
 * (header + ASCII art), monospace, no color, once per instance, SSR-safe, no
 * console groups.
 */
export function createBrandingBanner(): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) return;
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const banner of DEFAULT_BANNERS) {
      consoleTarget.info(`%c${formatBanner(banner)}`, MONO_STYLE);
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
  - It makes 2 `info` calls (one per brand), each `("%c"+content, "font-family:
    monospace")`. Assert by structure: each content's first line is the caption
    (`Website by` / `Powered by`) and its last line ends with the URL; the style
    arg is `font-family: monospace` (no color).
  - Once-guard: calling `showBranding()` twice still yields only 2 `info` calls.
  - Custom `console` target: injected target receives the calls; global console
    untouched.
- **`test/banner.test.mjs`** — covers `createBrandingBanner` directly: 2 info
  calls, monospace style (no color), caption on the first line, ASCII art
  present, URL right-aligned (padded) on the last line, once-guard.
- **`test/package-smoke.test.mjs`** — update assertions: 2 `info` calls; assert
  each URL appears within some call's content (the injected `group`/`groupEnd`
  remain provided but unused).
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
