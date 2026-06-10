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

## Development

```sh
npm test
npm run typecheck
npm pack --dry-run
```
