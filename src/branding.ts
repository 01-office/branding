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

const DEFAULT_BANNERS: BrandBanner[] = [
  { caption: "Website by", art: WORKS_ART, link: "https://01.works" },
  { caption: "Powered by", art: SOFTWARE_ART, link: "https://01.software" },
];

/**
 * Build the combined log for one brand: the caption on its own line, then the
 * ASCII wordmark, then the URL right-aligned to the banner's width on the line
 * below the art. The bare URL is auto-linked by the browser console.
 */
function formatBanner(banner: BrandBanner): string {
  const artWidth = Math.max(
    ...banner.art.split("\n").map((line) => line.length),
  );
  const width = Math.max(artWidth, banner.caption.length, banner.link.length);
  const linkPad = " ".repeat(width - banner.link.length);
  return `${banner.caption}\n${banner.art}\n${linkPad}${banner.link}`;
}

/**
 * Create the default 01.works branding printer. For each brand it prints a
 * single `console.info` log: the caption, the ASCII-art wordmark (figlet
 * "Standard"), and then the URL right-aligned beneath the art. Uses a monospace
 * `%c` style (no color) so the right-aligned URL stays flush, and no console
 * groups. Shows at most once per instance and is SSR-safe (no `window` access,
 * no import-time side effects).
 */
export function createBrandingBanner(): (options?: BrandingOptions) => void {
  let hasShown = false;
  return function show(options: BrandingOptions = {}): void {
    if (hasShown) {
      return;
    }
    hasShown = true;
    const consoleTarget = options.console ?? globalThis.console;
    for (const banner of DEFAULT_BANNERS) {
      consoleTarget.info(`%c${formatBanner(banner)}`, MONO_STYLE);
    }
  };
}

