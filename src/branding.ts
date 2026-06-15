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

/** Caption style: dim gray, sits above each banner. */
const CAPTION_STYLE = "color: #888888";
/** 01.works banner color (blue) + monospace to preserve alignment. */
const WORKS_STYLE = "font-family: monospace; color: #2563eb";
/** 01.software banner color (violet) + monospace. */
const SOFTWARE_STYLE = "font-family: monospace; color: #7c3aed";

// figlet "Standard" font output, hardcoded (zero runtime dependency).
// Double-quoted literals: the strings contain backslashes, apostrophes, and a
// backtick (01.software), so they must NOT be template literals.
const WORKS_ART =
  "   ___  _                    _        \n  / _ \\/ |_      _____  _ __| | _____ \n | | | | \\ \\ /\\ / / _ \\| '__| |/ / __|\n | |_| | |\\ V  V / (_) | |  |   <\\__ \\\n  \\___/|_(_)_/\\_/ \\___/|_|  |_|\\_\\___/";
const SOFTWARE_ART =
  "   ___  _              __ _                          \n  / _ \\/ |  ___  ___  / _| |___      ____ _ _ __ ___ \n | | | | | / __|/ _ \\| |_| __\\ \\ /\\ / / _` | '__/ _ \\\n | |_| | |_\\__ \\ (_) |  _| |_ \\ V  V / (_| | | |  __/\n  \\___/|_(_)___/\\___/|_|  \\__| \\_/\\_/ \\__,_|_|  \\___|";

type BrandBanner = {
  caption: string;
  art: string;
  style: string;
  link: string;
};

const DEFAULT_BANNERS: BrandBanner[] = [
  { caption: "Website by", art: WORKS_ART, style: WORKS_STYLE, link: "https://01.works" },
  { caption: "Powered by", art: SOFTWARE_ART, style: SOFTWARE_STYLE, link: "https://01.software" },
];

/**
 * Create the default 01.works branding printer: emphasized ASCII-art banners
 * (figlet "Standard"), each with a dim caption, brand-colored `%c` art, and the
 * plain URL — no console groups. Shows at most once per instance and is SSR-safe
 * (no `window` access, no import-time side effects).
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
      consoleTarget.info(`%c${banner.caption}`, CAPTION_STYLE);
      consoleTarget.info(`%c${banner.art}`, banner.style);
      consoleTarget.info(banner.link);
    }
  };
}

