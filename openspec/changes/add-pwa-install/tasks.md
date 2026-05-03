# Tasks: add-pwa-install

## 1. Branding Config Foundation (api side)

- [x] 1.1 Add `SITE_SHORT_NAME` to `apps/api/src/env.ts` Zod schema (optional string, max 12 chars validation)
- [x] 1.2 Add `SITE_WEBAPP_URL` to `apps/api/src/env.ts` Zod schema (required string, URL format)
- [x] 1.3 RED: Write unit test for `createBrandingConfig()` with default truncation (name: "Shared Spaces" → shortName: "Shared Space")
- [x] 1.4 GREEN: Create `apps/api/src/branding.config.ts` factory exporting `createBrandingConfig()` that reads env vars and returns `{ name, shortName, logoUrl }`, implementing derivation rule `shortName = SITE_SHORT_NAME ?? name.slice(0, 12).trimEnd()`
- [x] 1.5 RED: Write unit test for custom `SITE_SHORT_NAME` value
- [x] 1.6 GREEN: Pass through custom value when set
- [x] 1.7 RED: Write unit test for `SITE_SHORT_NAME` exactly 12 chars (boundary case, should succeed)
- [x] 1.8 GREEN: Verify validation allows exactly 12 chars
- [x] 1.9 RED: Write unit test rejecting `SITE_SHORT_NAME` longer than 12 chars
- [x] 1.10 GREEN: Add validation throwing error when length > 12
- [x] 1.11 COMMIT: `feat(api): add SITE_SHORT_NAME and SITE_WEBAPP_URL env vars with branding config factory`

## 2. Extend `config.siteInfo` tRPC Procedure

- [x] 2.1 RED: Write test for `config.siteInfo` returning `shortName` derived from default name
- [x] 2.2 GREEN: Update `packages/api/infrastructure/routers/config.router.ts` to inject `BrandingConfig` via constructor and add `shortName` field to procedure response
- [x] 2.3 RED: Write test for `config.siteInfo` returning custom `shortName` from env
- [x] 2.4 GREEN: Pass through custom value from branding config
- [x] 2.5 Update existing tests to assert all three fields (name, shortName, logoUrl)
- [x] 2.6 Run `bun run typecheck` to verify webapp tRPC types regenerate cleanly
- [x] 2.7 COMMIT: `feat(api): add shortName to config.siteInfo response`

## 3. Manifest Endpoint in `apps/api`

- [x] 3.1 RED: Write integration test hitting `/manifest.webmanifest`, asserting content type `application/manifest+json` and HTTP 200
- [x] 3.2 GREEN: Create `apps/api/src/routes/manifest.route.ts` with Elysia route `GET /manifest.webmanifest` returning manifest JSON with `Content-Type: application/manifest+json`
- [x] 3.3 RED: Write integration test asserting manifest `name` reflects `SITE_NAME` env var
- [x] 3.4 GREEN: Inject `BrandingConfig` into manifest route handler and pass `name` from branding config
- [x] 3.5 RED: Write integration test asserting manifest `short_name` reflects `SITE_SHORT_NAME` env var
- [x] 3.6 GREEN: Pass `short_name` from branding config
- [x] 3.7 RED: Write integration test asserting icon URLs are absolute and use `SITE_WEBAPP_URL`
- [x] 3.8 GREEN: Inject `SITE_WEBAPP_URL` and construct absolute URLs using it
- [x] 3.9 Manifest fields: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color: "#ffffff"`, `theme_color: "#000000"`
- [x] 3.10 Icons array: `{ src: "${SITE_WEBAPP_URL}/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }`, `{ src: "${SITE_WEBAPP_URL}/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }`, `{ src: "${SITE_WEBAPP_URL}/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }`
- [x] 3.11 Mount manifest route in `apps/api/src/index.ts` at `/manifest.webmanifest`
- [x] 3.12 COMMIT: `feat(api): add /manifest.webmanifest endpoint`

## 4. Static Icon Assets

- [x] 4.1 Create `apps/webapp/public/` directory if it doesn't exist
- [x] 4.2 Add placeholder `icon-192.png` (192×192 PNG, any-purpose)
- [x] 4.3 Add placeholder `icon-512.png` (512×512 PNG, any-purpose)
- [x] 4.4 Add placeholder `icon-maskable-512.png` (512×512 PNG, maskable safe zone)
- [x] 4.5 Add placeholder `apple-touch-icon.png` (180×180 PNG)
- [x] 4.6 Document in `apps/webapp/README.md`: "Placeholder icons — replace with branded artwork before production deployment. Icons should reflect the coliving space's visual identity."
- [x] 4.7 COMMIT: `feat(webapp): add placeholder PWA icon assets`

## 5. `index.html` Install Metadata

- [x] 5.1 Add `<link rel="manifest" href="%VITE_API_URL%/manifest.webmanifest" crossorigin="use-credentials">` to `apps/webapp/index.html` (Vite replaces `%VITE_API_URL%` at build time natively)
- [x] 5.2 Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
- [x] 5.3 Add `<meta name="theme-color" content="oklch(1 0 0)" media="(prefers-color-scheme: light)">`
- [x] 5.4 Add `<meta name="theme-color" content="oklch(0.145 0 0)" media="(prefers-color-scheme: dark)">`
- [x] 5.5 Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- [x] 5.6 Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- [x] 5.7 Verify existing inline dark-mode bootstrap script remains intact
- [x] 5.8 COMMIT: `feat(webapp): add PWA install metadata to index.html`

## 6. Document Title Sync (webapp)

- [x] 6.1 Create `apps/webapp/src/hooks/use-document-title.ts` hook accepting `title: string | undefined`
- [x] 6.2 Hook updates `document.title` when `title` is defined
- [x] 6.3 RED: Write test for `useDocumentTitle` updating `document.title` when called with a string
- [x] 6.4 GREEN: Implement hook with `useEffect` setting `document.title`
- [x] 6.5 Update `apps/webapp/src/routes/__root.tsx` to call `useDocumentTitle(siteInfo?.name)` after `config.siteInfo` query resolves
- [x] 6.6 Keep static `<title>Shared Spaces</title>` fallback in `index.html`
- [x] 6.7 RED: Write test mocking `config.siteInfo` to return `{ name: "Casa Verde" }` and asserting `document.title === "Casa Verde"`
- [x] 6.8 GREEN: Wire hook to query data
- [x] 6.9 COMMIT: `feat(webapp): sync document title with site branding`

## 7. Verification & Polish

- [x] 7.1 Manual verification on Android Chrome: install prompt appears, app installs, opens in standalone, icon and short name correct
- [x] 7.2 Manual verification on iOS Safari: "Add to Home Screen" works, apple-touch-icon shows, app opens in standalone, status bar style correct
- [x] 7.3 Run `bun run lint:fix` from root
- [x] 7.4 Run `bun run typecheck` from root
- [x] 7.5 Run `bun test` from root
- [x] 7.6 Run `/task-code-review` to review production code against conventions
- [x] 7.7 Run `/task-tests-review` to review test quality and coverage
- [x] 7.8 Run `/task-architecture-review` to verify hexagonal architecture compliance
- [x] 7.9 Run `/task-frontend-review` to review frontend components and patterns
- [x] 7.10 Address all findings from review tasks
- [x] 7.11 Re-run validation trio after review fixes

## 8. Documentation

- [x] 8.1 Update `apps/webapp/README.md` with PWA install flow section
- [x] 8.2 Document new env vars: `SITE_SHORT_NAME` (optional, ≤12 chars, defaults to truncated `SITE_NAME`), `SITE_WEBAPP_URL` (required, webapp origin for manifest icon URLs)
- [x] 8.3 Document icon replacement procedure: "To customize PWA icons, replace the placeholder PNGs in `apps/webapp/public/` with branded artwork. Maintain the specified dimensions and formats."
- [x] 8.4 Add note: "Changing site name requires reinstalling the PWA on already-installed devices (browsers freeze the home-screen name at install time)."
- [x] 8.5 Add note: "Deployments with a different `SITE_NAME` will briefly show 'Shared Spaces' in the browser tab title until `config.siteInfo` resolves. This is a trade-off to avoid build-time substitution and maintain runtime configurability."
- [x] 8.6 COMMIT: `docs(webapp): document PWA install flow and icon customization`
