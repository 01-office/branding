"use client";

import { useEffect } from "react";

import { showBranding, type BrandingOptions } from "./index.js";

/**
 * React hook that shows the 01.works developer-console branding once, after the
 * component mounts.
 *
 * SSR-safe: the effect only runs on the client, so server rendering produces no
 * branding side effect. Branding is shown at most once per module instance, so
 * the options captured on first mount are the only ones ever used.
 */
export function useBranding(options: BrandingOptions = {}): void {
  useEffect(() => {
    showBranding(options);
    // Intentionally run once on mount — see the note above about idempotency.
  }, []);
}

/**
 * Renderless React component that shows the 01.works developer-console branding
 * once. Drop it anywhere in the tree (typically the root layout) and it renders
 * nothing.
 */
export function Branding(options: BrandingOptions = {}): null {
  useBranding(options);
  return null;
}
