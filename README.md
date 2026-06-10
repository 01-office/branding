# @01.works/branding

Usable shared branding utilities for 01.works.

## Installation

```sh
npm install github:01-office/branding
```

After the package is published to npm, install it with
`npm install @01.works/branding`.

## Usage

```ts
import { showBranding } from "@01.works/branding";

showBranding();
```

The package does not run automatically. Call `showBranding()` explicitly where
you want the styled developer-console message to appear. Repeated calls from
the same module instance produce only one message.

`showBranding()` is SSR-safe: it does not access `window` and has no import-time
side effects.

## API

### `showBranding(options?: BrandingOptions): void`

Logs the 01.works branding message with `console.info`.

Pass a console-compatible target when the message should use a specific logger:

```ts
showBranding({ console: customConsole });
```

```ts
type BrandingOptions = {
  console?: Pick<Console, "info">;
};
```

## React

A React entry point is available at `@01.works/branding/react` for apps that
prefer to drop branding in declaratively. React is an optional peer dependency —
the core entry above has no React dependency.

```tsx
// app/layout.tsx (Next.js App Router)
import { Branding } from "@01.works/branding/react";

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

Prefer a hook? `useBranding()` does the same thing from inside your own client
component:

```tsx
"use client";
import { useBranding } from "@01.works/branding/react";

export function Providers({ children }) {
  useBranding();
  return children;
}
```

Both accept the same `BrandingOptions` as `showBranding()`.

## Development

```sh
npm test
npm run typecheck
npm pack --dry-run
```
