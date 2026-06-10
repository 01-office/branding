export type BrandingOptions = {
  console?: Pick<Console, "group" | "groupEnd" | "info">;
};

const WEBSITE_GROUP_LABEL = "Website by";
const WEBSITE_LINK = "https://01.works";
const POWERED_GROUP_LABEL = "Powered by";
const POWERED_LINK = "https://01.software";

let hasShownBranding = false;

export function showBranding(options: BrandingOptions = {}): void {
  if (hasShownBranding) {
    return;
  }

  hasShownBranding = true;
  const consoleTarget = options.console ?? globalThis.console;

  consoleTarget.group(WEBSITE_GROUP_LABEL);
  consoleTarget.info(WEBSITE_LINK);
  consoleTarget.groupEnd();

  consoleTarget.group(POWERED_GROUP_LABEL);
  consoleTarget.info(POWERED_LINK);
  consoleTarget.groupEnd();
}
