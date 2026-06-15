"use client";

import { useEffect, useRef } from "react";

import {
  createBranding,
  createBrandingBanner,
  showBranding,
  type BrandingGroup,
  type BrandingOptions,
  type BrandingPrinter,
} from "./index.js";

/**
 * Props for {@link Branding} and {@link useBranding}. With no props, the
 * default 01.works banner is shown once app-wide.
 */
export type BrandingProps = BrandingOptions & {
  /** Custom group branding. When supplied, this fully replaces the default preset. */
  groups?: BrandingGroup[];
  /** Also show the 01.software banner. Ignored when `groups` is supplied. */
  includeSoftware?: boolean;
};

/**
 * Pick the branding printer for the given props. Returns the shared
 * `showBranding` singleton when no `groups` or `includeSoftware` are supplied
 * (default 01.works, shown once app-wide). With `includeSoftware`, returns a
 * fresh banner instance that prints 01.works and 01.software. With `groups`,
 * returns a fresh `createBranding({ groups })` instance and ignores
 * `includeSoftware`. Exported for testing — prefer `<Branding>`.
 */
export function resolveBrandingShow(
  groups?: BrandingGroup[],
  includeSoftware = false,
): BrandingPrinter {
  if (groups) {
    return createBranding({ groups });
  }
  return includeSoftware
    ? createBrandingBanner({ includeSoftware })
    : showBranding;
}

/**
 * React hook that shows developer-console branding once, after the component
 * mounts. With no `groups`, it shows the default 01.works branding via the
 * shared singleton (once app-wide), or a per-component 01.works + 01.software
 * banner instance when `includeSoftware` is true. With `groups`, it builds a
 * per-component custom branding instance — held in a ref so it survives React
 * StrictMode's dev double-invoke — and shows it once per mount.
 *
 * SSR-safe: the effect only runs on the client, so server rendering produces no
 * branding side effect. The config is captured once on mount; later prop
 * changes are intentionally ignored (branding is a one-shot side effect).
 */
export function useBranding(props: BrandingProps = {}): void {
  const { console: consoleTarget, groups, includeSoftware } = props;
  const showRef = useRef<BrandingPrinter | null>(null);
  if (showRef.current === null) {
    showRef.current = resolveBrandingShow(groups, includeSoftware);
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
