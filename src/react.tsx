"use client";

import { useEffect } from "react";

import {
  createBranding,
  showBranding,
  type BrandingConfig,
  type BrandingGroup,
  type BrandingOptions,
} from "./index.js";

/**
 * Props for {@link Branding} and {@link useBranding}. A superset of
 * {@link BrandingOptions} that also accepts the branding `groups` from
 * {@link BrandingConfig}, so custom branding can be configured via props.
 */
export type BrandingProps = Partial<BrandingConfig> & BrandingOptions;

/**
 * Pick the branding printer for the given props. Returns the shared
 * `showBranding` singleton when no `groups` are supplied (default 01.works,
 * shown once app-wide), or a fresh `createBranding({ groups })` instance for a
 * custom configuration. Exported for testing — prefer `<Branding>`.
 */
export function resolveBrandingShow(
  groups?: BrandingGroup[],
): (options?: BrandingOptions) => void {
  return groups ? createBranding({ groups }) : showBranding;
}

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
