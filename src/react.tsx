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
 * shared branding singleton is used and no bundled banner is shown.
 */
export type BrandingProps = BrandingOptions & {
  /** Custom group branding. When supplied, bundled brand flags are ignored. */
  groups?: BrandingGroup[];
  /** Show the bundled 01.works banner. Ignored when `groups` is supplied. */
  includeWorks?: boolean;
  /** Show the bundled 01.software banner. Ignored when `groups` is supplied. */
  includeSoftware?: boolean;
};

type BundledBrandingOptions = Pick<
  BrandingProps,
  "includeWorks" | "includeSoftware"
>;

/**
 * Pick the branding printer for the given props. Returns the shared
 * `showBranding` singleton when no `groups` or bundled brand flags are
 * supplied. With bundled brand flags, returns a fresh banner instance. With
 * `groups`, returns a fresh `createBranding({ groups })` instance and ignores
 * bundled brand flags. Exported for testing — prefer `<Branding>`.
 */
export function resolveBrandingShow(
  groups?: BrandingGroup[],
  bundled: BundledBrandingOptions = {},
): BrandingPrinter {
  if (groups) {
    return createBranding({ groups });
  }
  return bundled.includeWorks || bundled.includeSoftware
    ? createBrandingBanner(bundled)
    : showBranding;
}

/**
 * React hook that shows developer-console branding once, after the component
 * mounts. With no `groups` or bundled brand flags, it uses the shared singleton
 * (once app-wide) and logs nothing. With bundled brand flags, it creates a
 * per-component banner instance. With `groups`, it builds a per-component
 * custom branding instance — held in a ref so it survives React StrictMode's
 * dev double-invoke — and shows it once per mount.
 *
 * SSR-safe: the effect only runs on the client, so server rendering produces no
 * branding side effect. The config is captured once on mount; later prop
 * changes are intentionally ignored (branding is a one-shot side effect).
 */
export function useBranding(props: BrandingProps = {}): void {
  const { console: consoleTarget, groups, includeWorks, includeSoftware } = props;
  const showRef = useRef<BrandingPrinter | null>(null);
  if (showRef.current === null) {
    showRef.current = resolveBrandingShow(groups, {
      ...(includeWorks === undefined ? {} : { includeWorks }),
      ...(includeSoftware === undefined ? {} : { includeSoftware }),
    });
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
