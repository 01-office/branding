export type BrandingOptions = {
  console?: Pick<Console, "info">;
};

const MESSAGE = "%c01.works%c https://01.works";
const BRAND_STYLE = "background: #000; color: #9fff6b;";

let hasShownBranding = false;

export function showBranding(options: BrandingOptions = {}): void {
  if (hasShownBranding) {
    return;
  }

  hasShownBranding = true;
  const consoleTarget = options.console ?? globalThis.console;
  consoleTarget.info(MESSAGE, BRAND_STYLE, "");
}
