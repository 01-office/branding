export * from "./core.js";
export * from "./logger.js";
export * from "./branding.js";

import { createBrandingBanner } from "./branding.js";

/** Shared no-op branding printer. Pass explicit options to createBrandingBanner for bundled brands. */
export const showBranding = createBrandingBanner();
