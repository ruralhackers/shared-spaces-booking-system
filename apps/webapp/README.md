# Webapp

Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4 frontend for the shared-spaces booking system.

## PWA Install

The webapp is installable as a Progressive Web App on mobile devices. When users visit the site from a mobile browser, they'll see an install prompt (Android Chrome) or can use "Add to Home Screen" (iOS Safari).

### Environment Variables

**Required:**
- `VITE_API_URL` — API server URL (e.g., `http://localhost:4001` in dev)

**Optional:**
- `VITE_BOOKING_TZ` — Timezone for booking display (defaults to `Europe/Madrid`)

The site name and branding are configured on the API side via `SITE_NAME`, `SITE_SHORT_NAME`, and `SITE_WEBAPP_URL` — see `apps/api` README.

### PWA Icons

The `public/` directory contains placeholder PWA icons and favicon (blue placeholders). **Replace these with branded artwork before production deployment.** Icons should reflect the coliving space's visual identity.

Required icon files:
- `favicon.ico` — 32×32px (or multi-size), browser tab icon
- `icon-192.png` — 192×192px, any-purpose
- `icon-512.png` — 512×512px, any-purpose
- `icon-maskable-512.png` — 512×512px, maskable (safe zone for adaptive icons)
- `apple-touch-icon.png` — 180×180px, iOS home screen icon

Maintain the specified dimensions and formats when replacing placeholders.

### Important Notes

- **Site name changes:** Changing `SITE_NAME` on the API requires users to **uninstall and reinstall the PWA** to see the new name on their home screen. Browsers freeze the home-screen icon name at install time.

- **Title flicker:** Deployments with a different `SITE_NAME` will briefly show "Shared Spaces" in the browser tab title until `config.siteInfo` resolves. This is a trade-off to avoid build-time substitution and maintain runtime configurability.

- **No offline support:** The PWA does not include a service worker or offline caching. The app requires network access to function.
