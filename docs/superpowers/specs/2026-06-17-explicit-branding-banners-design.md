# Design: Explicit Branding Banners

## Goal

Make bundled 01.works branding opt-in instead of default-on. Consumers should be
able to request `01.works`, `01.software`, or both through explicit options.

## API

- `createBrandingBanner()` prints nothing by default.
- `createBrandingBanner({ includeWorks: true })` prints the 01.works banner.
- `createBrandingBanner({ includeSoftware: true })` prints the 01.software banner.
- `createBrandingBanner({ includeWorks: true, includeSoftware: true })` prints
  both banners in that order.
- React `BrandingProps` mirrors the core banner options with `includeWorks?: boolean`
  and `includeSoftware?: boolean`.
- Custom `groups` continue to fully replace bundled banner behavior.

## Compatibility

`showBranding()` remains a once-guarded exported printer, but because the default
banner config is empty, calling it without options no longer logs bundled
branding. Consumers that want the previous 01.works-only behavior should use
`createBrandingBanner({ includeWorks: true })` or `<Branding includeWorks />`.

## Testing

Update banner and React tests first so the current implementation fails against
the new opt-in behavior. Then update implementation and README examples.
