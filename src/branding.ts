/** Options accepted by every branding printer invocation. */
export type BrandingOptions = {
  /**
   * Console-compatible target. Banner printers use `info`; group branding uses
   * all three methods.
   */
  console?: BrandingConsole;
};

/** Console surface accepted by branding printers. */
export type BrandingConsole = Pick<Console, "group" | "groupEnd" | "info">;

/** A once-guarded function that prints branding to the chosen console target. */
export type BrandingPrinter = (options?: BrandingOptions) => void;

/** A single labeled link group shown in the console. */
export type BrandingGroup = {
  /** Caption shown before the link, for example "Website by". */
  label: string;
  /** Link printed in the console. */
  link: string;
};

/** Configuration describing which groups a branding instance prints. */
export type BrandingConfig = {
  /** Groups to print. Defaults to an empty list. */
  groups: BrandingGroup[];
};

const DEFAULT_CONFIG: BrandingConfig = {
  groups: [],
};

/**
 * Create a branding printer for the given config. The returned function shows
 * the branding at most once per instance and is SSR-safe (no `window` access,
 * no import-time side effects).
 */
export function createBranding(
  config: BrandingConfig = DEFAULT_CONFIG,
): BrandingPrinter {
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

// figlet "Standard" font output, hardcoded (zero runtime dependency).
// Double-quoted literals: the strings contain backslashes, apostrophes, and a
// backtick (01.software), so they must NOT be template literals.
const WORKS_ART =
  "   ___  _                    _        \n  / _ \\/ |_      _____  _ __| | _____ \n | | | | \\ \\ /\\ / / _ \\| '__| |/ / __|\n | |_| | |\\ V  V / (_) | |  |   <\\__ \\\n  \\___/|_(_)_/\\_/ \\___/|_|  |_|\\_\\___/";
const SOFTWARE_ART =
  "   ___  _              __ _                          \n  / _ \\/ |  ___  ___  / _| |___      ____ _ _ __ ___ \n | | | | | / __|/ _ \\| |_| __\\ \\ /\\ / / _` | '__/ _ \\\n | |_| | |_\\__ \\ (_) |  _| |_ \\ V  V / (_| | | |  __/\n  \\___/|_(_)___/\\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|";

/**
 * Monospace only (no color): keeps the right-aligned URL flush with the banner's
 * right edge. Most browser consoles are monospace already; this guarantees it.
 */
const MONO_STYLE = "font-family: monospace";

type BrandBanner = {
  caption: string;
  art: string;
  link: string;
};

export type BrandingBannerConfig = {
  /** Print the bundled 01.works banner. */
  includeWorks?: boolean;
  /** Print the bundled 01.software banner. */
  includeSoftware?: boolean;
};

const WORKS_BANNER: BrandBanner = {
  caption: "Website by",
  art: WORKS_ART,
  link: "https://01.works",
};

const SOFTWARE_BANNER: BrandBanner = {
  caption: "Powered by",
  art: SOFTWARE_ART,
  link: "https://01.software",
};

/**
 * Build the combined log for one brand: the caption on its own line, then the
 * ASCII wordmark, a blank line, then the URL right-aligned to the banner's width
 * on the line below the art. The bare URL is auto-linked by the browser console.
 */
function formatBanner(banner: BrandBanner): string {
  const artWidth = Math.max(
    ...banner.art.split("\n").map((line) => line.length),
  );
  const width = Math.max(artWidth, banner.caption.length, banner.link.length);
  const linkPad = " ".repeat(width - banner.link.length);
  return `${banner.caption}\n${banner.art}\n\n${linkPad}${banner.link}`;
}

/**
 * Create a bundled branding printer. With no config it prints nothing. Pass
 * `{ includeWorks: true }`, `{ includeSoftware: true }`, or both to print the
 * corresponding banners. Each banner is one `console.info` log: the caption,
 * the ASCII-art wordmark (figlet "Standard"), and then the URL right-aligned
 * beneath the art. Uses a monospace `%c` style (no color) so the right-aligned
 * URL stays flush, and no console groups. Shows at most once per instance and
 * is SSR-safe (no `window` access, no import-time side effects).
 */
export function createBrandingBanner(
  config: BrandingBannerConfig = {},
): BrandingPrinter {
  let hasShown = false;
  const banners = [
    ...(config.includeWorks ? [WORKS_BANNER] : []),
    ...(config.includeSoftware ? [SOFTWARE_BANNER] : []),
  ];
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) {
      return;
    }
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const banner of banners) {
      consoleTarget.info(`%c${formatBanner(banner)}`, MONO_STYLE);
    }
  };
}
