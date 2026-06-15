"use client";

import { useEffect, useRef } from "react";

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
 * React hook that shows developer-console branding once, after the component
 * mounts. With no `groups`, it shows the default 01.works branding via the
 * shared singleton (once app-wide). With `groups`, it builds a per-component
 * branding instance — held in a ref so it survives React StrictMode's dev
 * double-invoke — and shows it once per mount.
 *
 * SSR-safe: the effect only runs on the client, so server rendering produces no
 * branding side effect. The config is captured once on mount; later prop
 * changes are intentionally ignored (branding is a one-shot side effect).
 */
export function useBranding(props: BrandingProps = {}): void {
  const { console: consoleTarget, groups } = props;
  const showRef = useRef<((options?: BrandingOptions) => void) | null>(null);
  if (showRef.current === null) {
    showRef.current = resolveBrandingShow(groups);
  }
  useEffect(() => {
    showRef.current?.(consoleTarget ? { console: consoleTarget } : {});
    // Intentionally run once on mount — see the note above about idempotency.
  }, []);
}

/**
 * Renderless React component that shows developer-console branding once. Drop it
 * anywhere in the tree (typically the root layout) and it renders nothing.
 * Accepts the same props as {@link useBranding}.
 */
export function Branding(props: BrandingProps = {}): null {
  useBranding(props);
  return null;
}
