# Proposal: add-pwa-install

## Why

The webapp is a coliving shared-spaces booking system accessed primarily by residents from mobile browsers. Users need quick access to the booking interface without navigating through browser tabs. Making the webapp installable as a Progressive Web App (PWA) allows residents to add it to their phone home screen, where it opens in standalone mode without browser chrome, providing a native-app-like experience.

The existing `site-branding` capability already supports per-deployment `SITE_NAME` configuration. The PWA install flow must reuse that branding so the home screen icon name and the in-app header name remain consistent across deployments.

## What Changes

- Add **Web App Manifest** served dynamically by `apps/api` at `GET /manifest.webmanifest`
- Add **static placeholder icons** in `apps/webapp/public/` (192×192, 512×512 PNG)
- Add **install metadata** in `apps/webapp/index.html`: `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `<meta name="theme-color">` (light + dark via media query), `<meta name="apple-mobile-web-app-capable">`, `<meta name="apple-mobile-web-app-status-bar-style">`
- Extend **site branding** with `SITE_SHORT_NAME` env var (optional, ≤12 chars) and `shortName` field in `config.siteInfo` tRPC response (falls back to truncated `name` when not set)
- Add **`SITE_WEBAPP_URL` env var** (required, webapp origin URL) so the manifest can reference icons by absolute URL
- Update **document title** in webapp to reflect `config.siteInfo.name` after the query resolves; `index.html` keeps static fallback title `"Shared Spaces"` to avoid empty title on first paint (trade-off: deployments with a different `SITE_NAME` will briefly show "Shared Spaces" until the query resolves)
- Manifest endpoint reads `SITE_NAME` and `SITE_SHORT_NAME` from the same source as `config.siteInfo` (single source of truth)
- Manifest uses `display: standalone` so the app opens without browser chrome

**Result:** Android/Chrome shows the install prompt; iOS Safari supports "Add to Home Screen" with proper branding.

## Capabilities

### New Capabilities

- `pwa-install`: Web App Manifest endpoint, install metadata in `index.html`, static placeholder icons, and document title sync with site branding

### Modified Capabilities

- `site-branding`: Add `SITE_SHORT_NAME` env var and `shortName` field to `config.siteInfo` response

## Impact

**Affected packages:**
- `@dfs/api` — new Elysia route `GET /manifest.webmanifest` (plain JSON response, not tRPC)

**Affected apps:**
- `apps/api` — manifest endpoint reads env vars `SITE_NAME`, `SITE_SHORT_NAME`, and `SITE_WEBAPP_URL`
- `apps/webapp` — new static icons in `public/`, install metadata in `index.html`, document title update via tRPC query

**New environment variables:**
- `SITE_SHORT_NAME` (optional, ≤12 chars, defaults to truncated `SITE_NAME`)
- `SITE_WEBAPP_URL` (required, webapp origin URL for manifest icon references)

**Dependencies:**
- None (uses standard Web App Manifest spec)

**Breaking changes:**
- None (purely additive)

## Non-goals

- **Service worker / offline support**: No caching, background sync, or offline functionality in this change
- **Push notifications**: Not included
- **Configurable icons**: Icons remain static placeholders; no `SITE_ICON_URL` env var
- **Open Graph / social share metadata**: Not part of PWA install flow
- **Mobile app (Expo)**: This change only affects `apps/webapp`; the Expo app is independent
