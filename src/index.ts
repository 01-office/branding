export * from "./core.js";
export * from "./logger.js";
export * from "./branding.js";

import { createBrandingBanner } from "./branding.js";

/** Show the default 01.works developer-console branding (once per instance). */
export const showBranding = createBrandingBanner();
