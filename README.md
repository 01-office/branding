# @01.works/console

Usable shared branding utilities for 01.works.

## Installation

```sh
pnpm add @01.works/console
```

For a GitHub install before or outside npm publishing:

```sh
pnpm add github:01-office/console
```

## Usage

```ts
import { showBranding } from "@01.works/console";

showBranding();
```

The package does not run automatically. Call `showBranding()` explicitly where
you want the styled developer-console message to appear. Repeated calls from
the same module instance produce only one message.

`showBranding()` is SSR-safe: it does not access `window` and has no import-time
side effects.

## API

### `showBranding(options?: BrandingOptions): void`

Logs the 01.works branding with `console.info`: the caption, an ASCII-art
wordmark for `01.works`, then the URL right-aligned on the line below the art.
Rendered in monospace (via `%c`, no color) so the right-aligned URL stays flush;
the bare URL is auto-linked by the browser console. No console groups are used.

Pass a console-compatible target when the message should use a specific logger:

```ts
showBranding({ console: customConsole });
```

```ts
type BrandingOptions = {
  console?: BrandingConsole;
};

type BrandingConsole = Pick<Console, "group" | "groupEnd" | "info">;
type BrandingPrinter = (options?: BrandingOptions) => void;
```

To include the 01.software banner from the core API, create an opt-in banner
printer:

```ts
import { createBrandingBanner } from "@01.works/console";

const show = createBrandingBanner({ includeSoftware: true });
show({ console: customConsole });
```

```ts
type BrandingBannerConfig = {
  includeSoftware?: boolean;
};
```

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
show({ console: customConsole });
```

`createBranding(config)` returns a once-guarded, SSR-safe `show()` function.
`showBranding()` is the default 01.works instance. Custom `groups` fully replace
the default preset.

```ts
type BrandingGroup = {
  label: string;
  link: string;
};

type BrandingConfig = {
  groups: BrandingGroup[];
};
```

## React

A React entry point is available at `@01.works/console/react` for apps that
prefer to drop branding in declaratively. React is an optional peer dependency —
the core entry above has no React dependency.

```tsx
// app/layout.tsx (Next.js App Router)
import { Branding } from "@01.works/console/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Branding />
      </body>
    </html>
  );
}
```

`Branding` is a renderless component (it returns `null`) that shows the branding
once, after mount. It ships a `"use client"` directive, so it works inside
Server Components without extra wrapping. SSR-safe: nothing is logged during
server rendering.

Pass `groups` to show custom branding instead of the 01.works default (any
console target can still be injected with `console`):

```tsx
<Branding groups={[{ label: "Website by", link: "https://acme.com" }]} />
```

Pass `includeSoftware` to include the 01.software banner alongside the default
01.works banner:

```tsx
<Branding includeSoftware />
```

All React variants accept a console-compatible target:

```tsx
<Branding includeSoftware console={customConsole} />
```

Both `Branding` and `useBranding` accept `BrandingProps` — the branding
`groups`, optional `includeSoftware`, plus an optional `console` target. With no
`groups`, the default 01.works branding is shown once for the whole app; with
`includeSoftware`, 01.software is also shown. With `groups`, each mounted
component shows its configured branding once and `includeSoftware` is ignored.

```ts
type BrandingProps = BrandingOptions & {
  groups?: BrandingGroup[];
  includeSoftware?: boolean;
};
```

Prefer a hook? `useBranding()` does the same thing from inside your own client
component:

```tsx
"use client";
import { useBranding } from "@01.works/console/react";

export function Providers({ children }) {
  useBranding();
  return children;
}
```

Both accept the same `BrandingProps` (branding `groups`, optional
`includeSoftware`, plus an optional `console` target).

## Development

```sh
pnpm test
pnpm run typecheck
pnpm pack --dry-run
```
