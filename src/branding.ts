export type BrandingOptions = {
  console?: Pick<Console, "group" | "groupEnd" | "info">;
};

/** A single labeled link group shown in the console. */
export type BrandingGroup = {
  label: string;
  link: string;
};

/** Configuration describing which groups a branding instance prints. */
export type BrandingConfig = {
  groups: BrandingGroup[];
};

const DEFAULT_CONFIG: BrandingConfig = {
  groups: [
    { label: "Website by", link: "https://01.works" },
    { label: "Powered by", link: "https://01.software" },
  ],
};

/**
 * Create a branding printer for the given config. The returned function shows
 * the branding at most once per instance and is SSR-safe (no `window` access,
 * no import-time side effects).
 */
export function createBranding(
  config: BrandingConfig = DEFAULT_CONFIG,
): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) {
      return;
    }
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const group of config.groups) {
      consoleTarget.group(group.label);
      consoleTarget.info(group.link);
      consoleTarget.groupEnd();
    }
  };
}

