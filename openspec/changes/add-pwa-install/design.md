# Design: add-pwa-install

## Context

The webapp is a coliving shared-spaces booking system accessed primarily by residents from mobile browsers. Users need quick access to the booking interface without navigating through browser tabs. Making the webapp installable as a Progressive Web App (PWA) allows residents to add it to their phone home screen, where it opens in standalone mode without browser chrome, providing a native-app-like experience.

Current state:
- `apps/webapp` is a Vite + React 19 SPA served from `apps/api` (Bun + Elysia + tRPC)
- Site branding is already runtime-configurable via `SITE_NAME` and `SITE_LOGO_URL` env vars
- `config.siteInfo` tRPC procedure exposes `{ name, logoUrl }` to the frontend
- No PWA manifest, no install metadata, no static icons
- `index.html` has a static `<title>Shared Spaces</title>` fallback
- Dark mode is handled via inline script in `index.html` that reads `localStorage` and sets `.dark` class

## Goals / Non-Goals

**Goals:**
- Make the webapp installable as a PWA on Android Chrome and iOS Safari
- Reuse existing site branding (`SITE_NAME`) so the home screen icon name matches the in-app header name
- Add `SITE_SHORT_NAME` env var (optional, ≤12 chars) for the home screen icon label
- Serve a dynamic Web App Manifest from `apps/api` at `GET /manifest.webmanifest`
- Add static placeholder icons in `apps/webapp/public/` (192×192, 512×512, maskable, apple-touch-icon)
- Add install metadata to `index.html` (manifest link, theme-color, apple-mobile-web-app-capable)
- Update `document.title` to reflect `config.siteInfo.name` after the query resolves
- Maintain single source of truth for branding (both tRPC procedure and manifest endpoint read from the same config)

**Non-Goals:**
- Service worker or offline support (no caching, no background sync)
- Push notifications
- Configurable icons via `SITE_ICON_URL` env var (static placeholders only)
- Open Graph / social share metadata
- Mobile app (Expo) integration (webapp only)

## Decisions

### Decision 1: Dynamic Manifest Endpoint vs. Static `public/manifest.webmanifest`

**Chosen:** Serve the manifest dynamically from `apps/api` at `GET /manifest.webmanifest` as a plain Elysia route (not tRPC).

**Rationale:**
- The site name is already runtime-configurable via `SITE_NAME` env var (existing `site-branding` capability)
- A static manifest would either hardcode `"Shared Spaces"` or require a build-time substitution step — both contradict the runtime branding model already in place
- The manifest must be served with `Content-Type: application/manifest+json`, which is incompatible with tRPC's JSON-RPC envelope
- Browsers fetch the manifest via `<link rel="manifest">` expecting a plain JSON response, not a tRPC procedure call

**Trade-offs:**
- Browsers cache the manifest aggressively (per spec), AND once a user installs the PWA the home-screen icon/name is frozen until they reinstall
- Acceptable because the site name changes rarely (per deployment, not per session)
- Changing the site name requires users to uninstall and reinstall the PWA to see the new name on their home screen

**Alternatives considered:**
- Static `public/manifest.webmanifest` with build-time substitution: Requires a build step for every deployment with a different name; breaks the runtime config model
- tRPC procedure returning manifest JSON: Wrong content type, wrong shape (tRPC wraps responses in `{ result: { data: ... } }`), browsers won't recognize it

### Decision 2: Single Source of Truth for Branding

**Chosen:** Create a shared branding config factory `createBrandingConfig()` in `apps/api/src/branding.config.ts` that reads env vars at api startup and returns `{ name, shortName, logoUrl }`. Both the `config.siteInfo` tRPC procedure and the manifest Elysia route inject this config via constructor.

**Rationale:**
- Prevents drift between the tRPC response and the manifest JSON
- Follows repo conventions: ports/adapters, constructor injection, no direct `process.env` reads inside handlers (see `docs/conventions/patterns/service-patterns.md`)
- Validation happens once at startup (fail fast if `SITE_SHORT_NAME` is set but >12 chars)
- Both consumers (tRPC router, manifest route) depend on the same abstraction
- Lives in `apps/api/src/` as app-level wiring/composition — branding is currently just 3 env vars and doesn't justify a full bounded context (`packages/site-branding/`). If branding grows (themes, i18n labels, etc.), it can be refactored into a proper context later.

**Layer mapping:** Branding config is **infrastructure** (configuration factory reading env vars). The manifest endpoint is **infrastructure** (HTTP adapter). No domain layer involved — this is pure config plumbing.

**Alternatives considered:**
- Duplicate env var reads in both handlers: Violates DRY, risks inconsistency
- Read env vars directly in handlers: Violates hexagonal architecture (infrastructure concerns leak into application layer)
- Store branding in the database: Over-engineering for a per-deployment constant; env vars are the right tool
- Create `packages/site-branding/` bounded context: Over-engineering for 3 env vars; revisit if branding grows

### Decision 3: `shortName` Derivation Rule

**Chosen:** 
- `SITE_SHORT_NAME` env var is optional and MUST be ≤12 characters
- When `SITE_SHORT_NAME` is not set: derive `shortName = name.slice(0, 12).trimEnd()`
- When `SITE_SHORT_NAME` is set but >12 chars: fail at startup with a configuration error (Zod validation)

**Rationale:**
- Web App Manifest spec recommends `short_name` ≤12 chars to fit under the home-screen icon without truncation
- Automatic derivation provides a sensible default (e.g., `"Shared Spaces"` → `"Shared Space"`)
- Explicit validation prevents silent truncation — config errors should be loud
- Failing at startup (not at request time) ensures the error is caught during deployment, not by end users

**Alternatives considered:**
- Always require `SITE_SHORT_NAME`: Adds friction for deployments that don't care about the short name
- Silently truncate `SITE_SHORT_NAME` if >12 chars: Hides config mistakes; better to fail loudly
- No length limit: Browsers will truncate unpredictably; better to enforce the spec recommendation

### Decision 4: CORS and `crossorigin="use-credentials"` for Manifest

**Chosen:** 
- The webapp loads the manifest from `${VITE_API_URL}/manifest.webmanifest` (cross-origin in production)
- The api already has CORS configured for the webapp origin with `credentials: true` (see `docs/conventions/patterns/frontend-patterns.md` "Backend host")
- Add `<link rel="manifest" href="..." crossorigin="use-credentials">` to `index.html`

**Rationale:**
- The manifest is served from the api origin, not the webapp origin
- The api uses credentialed CORS (for tRPC auth cookies, even though this app has no auth yet)
- The `crossorigin="use-credentials"` attribute is required when the manifest is on a different origin and the server uses credentialed CORS (per Web App Manifest spec)
- Without this attribute, browsers may refuse to load the manifest due to CORS policy

**Trade-offs:**
- Adds a cross-origin request on page load (negligible performance impact; manifest is cached aggressively)
- If the api CORS config is misconfigured, the manifest won't load (but this is already a problem for tRPC, so it's not a new risk)

**Alternatives considered:**
- Serve manifest from webapp origin: Requires duplicating branding logic in the webapp build step; breaks single source of truth
- Inline manifest as a data URI: Ugly, harder to debug, still requires runtime substitution

### Decision 5: Icon URLs in Manifest Must Be Absolute

**Chosen:** 
- Icons live in `apps/webapp/public/` (e.g., `/icon-192.png`)
- The manifest must reference them by absolute URL (e.g., `https://webapp.example.com/icon-192.png`)
- Add a new env var `SITE_WEBAPP_URL` on the api side (required, URL format, e.g., `https://webapp.example.com`)
- The manifest endpoint constructs absolute URLs: `${SITE_WEBAPP_URL}/icon-192.png`

**Rationale:**
- Web App Manifest spec requires icon URLs to be absolute (relative URLs are resolved relative to the manifest URL, which is on the api origin, not the webapp origin)
- Icons are static assets served by the webapp, not the api
- The api needs to know the webapp origin to build correct URLs
- Validation at startup ensures `SITE_WEBAPP_URL` is set and is a valid URL

**Alternatives considered:**
- Serve icons from the api: Requires copying static assets to the api; breaks separation of concerns
- Use relative URLs: Browsers would resolve them relative to `apps/api`, resulting in 404s
- Hardcode the webapp URL in the manifest handler: Breaks configurability; different deployments have different webapp URLs

### Decision 6: `<title>` Update Strategy

**Chosen:** 
- Keep the static `<title>Shared Spaces</title>` in `index.html` as a fallback
- After `config.siteInfo` resolves in the React tree, update `document.title` to the configured `name` via a `useDocumentTitle` hook
- Brief flicker on slow connections (static title → configured title)

**Rationale:**
- Search-engine snapshots and first paint are not blank (static fallback is visible immediately)
- Updating `document.title` after the query resolves is simple and requires no build-time substitution
- The flicker is acceptable for an internal tool (not a public-facing marketing site)
- Consistent with the existing pattern for theme (inline script in `index.html` for FOUC prevention, then React takes over)

**Trade-off explicitly accepted:** Deployments with a different `SITE_NAME` (e.g., "Casa Verde") will briefly show "Shared Spaces" until the query resolves. This contradicts the "single source of truth for branding" goal, but the alternative (build-time substitution via `transformIndexHtml`) would require a build per deployment and break the runtime config model. The flicker is the lesser evil.

**Alternatives considered:**
- Inline script to inject `VITE_API_URL` and fetch `config.siteInfo` before React mounts: Adds complexity, duplicates tRPC logic, breaks type safety
- Server-side rendering: Overkill for a client-only SPA; Vite doesn't support SSR out of the box
- Build-time substitution via `transformIndexHtml`: Breaks runtime configurability; requires a build per deployment

### Decision 7: `theme-color` for Light and Dark Modes

**Chosen:** 
- Add two `<meta name="theme-color">` tags with `media="(prefers-color-scheme: light)"` and `media="(prefers-color-scheme: dark)"`
- Light mode: `content="oklch(1 0 0)"` (white, from `:root --background` in `globals.css`)
- Dark mode: `content="oklch(0.145 0 0)"` (near-black, from `.dark --background` in `globals.css`)
- For the Web App Manifest `theme_color` and `background_color` fields, use hex equivalents (`#ffffff` and `#000000`) for maximum browser compatibility (older browsers may not support `oklch()` in manifest JSON)

**Rationale:**
- The browser's address bar and system UI chrome adapt to the app's theme
- Values match the existing theme tokens in `apps/webapp/src/styles/globals.css`
- The `media` attribute makes the theme-color responsive to the user's OS color scheme preference
- Consistent with the existing inline dark-mode bootstrap script in `index.html`
- `<meta name="theme-color">` supports modern CSS colors including `oklch()` in all current browsers
- Web App Manifest spec historically required CSS color strings; `oklch()` support is newer and less universal — using hex in the manifest JSON is safer

**Alternatives considered:**
- Single `theme-color` (no media query): Doesn't adapt to dark mode; looks wrong in dark mode
- Hardcoded hex colors everywhere: Drifts from the actual theme; better to use the same values as `globals.css` in HTML, hex in manifest
- Dynamic `theme-color` via JavaScript: Over-engineering; the `media` attribute handles this natively
- `oklch()` in manifest JSON: Cutting-edge but risks compatibility issues; hex is safer

### Decision 8: Static Placeholder Icons (No `SITE_ICON_URL` Yet)

**Chosen:** 
- Ship static placeholder icons in `apps/webapp/public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180×180)
- No `SITE_ICON_URL` env var in this change
- Document in `apps/webapp/README.md`: "Placeholder icons — replace with branded artwork before production deployment"

**Rationale:**
- Unblocks PWA install functionality without requiring custom artwork for every deployment
- Placeholder art is acceptable for the first iteration (internal tool, not public-facing)
- Adding `SITE_ICON_URL` configurability is a separate concern (requires dynamic icon generation or a CDN URL, both out of scope)
- Deployments that care about branding can replace the placeholder PNGs manually

**Trade-offs:**
- Every deployment shares the same placeholder icons (no per-deployment branding)
- Acceptable for the initial release; a follow-up change can introduce `SITE_ICON_URL` if needed

**Alternatives considered:**
- Dynamic icon generation from `SITE_ICON_URL`: Requires an image processing library (e.g., Sharp) and adds complexity; out of scope
- No icons: Browsers fall back to a screenshot or generic icon; looks unprofessional
- Require custom icons before merging: Blocks the feature on artwork; better to ship with placeholders

### Decision 9: No Service Worker (No Offline Support)

**Chosen:** No service worker, no `vite-plugin-pwa`, no offline caching.

**Rationale:**
- Zero risk of stale-cache bugs in the booking flow (bookings must always reflect the latest server state)
- No offline requirement (booking system requires network access to check availability and create bookings)
- Simpler mental model (no cache invalidation strategy, no background sync)
- Reduces bundle size and complexity

**Trade-offs:**
- The app won't work offline (acceptable; booking requires server communication anyway)
- No "Add to Home Screen" banner on repeat visits (browsers show the install prompt based on engagement signals, not service worker presence)

**Alternatives considered:**
- Add a service worker for offline support: Over-engineering; the app has no offline use case
- Use `vite-plugin-pwa` for automatic service worker generation: Adds complexity and risk for no benefit

### Decision 10: Manifest Endpoint Lives in `apps/api`, Not `apps/webapp`

**Chosen:** The manifest endpoint is an Elysia route in `apps/api`, mounted at `GET /manifest.webmanifest`.

**Rationale:**
- The manifest must read `SITE_NAME` and `SITE_SHORT_NAME` from env vars, which are only available on the api side (the webapp is a static SPA with no server-side logic)
- The api is already the source of truth for runtime config (see `config.siteInfo` tRPC procedure)
- Consistent with the existing architecture: `apps/api` is the backend host, `apps/webapp` is a static client

**Alternatives considered:**
- Serve manifest from `apps/webapp` via a Vite plugin: Requires duplicating branding logic in the webapp build step; breaks single source of truth
- Inline manifest as a `<script type="application/manifest+json">` in `index.html`: Non-standard, poor browser support, harder to debug

## Data Model

No database changes. All branding config is read from env vars at startup.

## Risks / Trade-offs

**[Risk]** Browsers cache the manifest aggressively; changing `SITE_NAME` won't update the home-screen icon name for already-installed PWAs
→ **Mitigation:** Document this behavior in `apps/webapp/README.md`; users must uninstall and reinstall the PWA to see the new name

**[Risk]** If `SITE_WEBAPP_URL` is misconfigured, icon URLs in the manifest will be broken (404s)
→ **Mitigation:** Validate `SITE_WEBAPP_URL` at startup (Zod schema); fail fast if invalid

**[Risk]** Cross-origin manifest request adds a network round-trip on page load
→ **Mitigation:** Browsers cache the manifest aggressively (per spec); negligible performance impact

**[Trade-off]** Static placeholder icons mean every deployment shares the same icon artwork
→ **Accepted:** Unblocks PWA install functionality; deployments can replace placeholders manually; a follow-up change can introduce `SITE_ICON_URL` if needed

**[Trade-off]** No service worker means no offline support
→ **Accepted:** The app has no offline use case (booking requires server communication); avoiding service worker complexity is a net win

**[Trade-off]** `document.title` flickers from static fallback to configured name on slow connections
→ **Accepted:** Brief flicker is acceptable for an internal tool; search engines and first paint see the static fallback

**[Risk]** If the api CORS config is misconfigured, the manifest won't load
→ **Mitigation:** The api already has CORS configured for tRPC; the manifest endpoint reuses the same CORS policy; no new risk

## Migration Plan

1. **Phase 1: Branding Config Foundation (api side)**
   - Add `SITE_SHORT_NAME` and `SITE_WEBAPP_URL` to `apps/api/src/env.ts` Zod schema
   - Create `apps/api/src/branding.config.ts` factory exporting `createBrandingConfig()`
   - Implement derivation rule: `shortName = SITE_SHORT_NAME ?? name.slice(0, 12).trimEnd()`
   - Add validation: fail at startup if `SITE_SHORT_NAME` >12 chars

2. **Phase 2: Extend `config.siteInfo` tRPC Procedure**
   - Update `packages/api/infrastructure/routers/config.router.ts` to inject `BrandingConfig` via constructor
   - Update `config.siteInfo` return shape to `{ name, shortName, logoUrl }`
   - Update tests to assert all three fields

3. **Phase 3: Manifest Endpoint in `apps/api`**
   - Create `apps/api/src/routes/manifest.route.ts` with Elysia route `GET /manifest.webmanifest`
   - Inject `BrandingConfig` and `SITE_WEBAPP_URL` into manifest route handler
   - Return JSON with `Content-Type: application/manifest+json` and HTTP 200
   - Manifest fields: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color: "#ffffff"`, `theme_color: "#000000"`, `icons` array
   - Icons array: `{ src: "${SITE_WEBAPP_URL}/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }`, etc.
   - Mount manifest route in `apps/api/src/index.ts` at `/manifest.webmanifest`

4. **Phase 4: Static Icon Assets**
   - Add placeholder PNGs to `apps/webapp/public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
   - Document in `apps/webapp/README.md`: "Placeholder icons — replace with branded artwork before production deployment"

5. **Phase 5: `index.html` Install Metadata**
   - Add `<link rel="manifest" href="%VITE_API_URL%/manifest.webmanifest" crossorigin="use-credentials">` (Vite replaces `%VITE_API_URL%` at build time natively)
   - Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - Add `<meta name="theme-color" content="oklch(1 0 0)" media="(prefers-color-scheme: light)">`
   - Add `<meta name="theme-color" content="oklch(0.145 0 0)" media="(prefers-color-scheme: dark)">`
   - Add `<meta name="apple-mobile-web-app-capable" content="yes">`
   - Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">`

6. **Phase 6: Document Title Sync (webapp)**
   - Create `apps/webapp/src/hooks/use-document-title.ts` hook accepting `title: string | undefined`
   - Hook updates `document.title` when `title` is defined
   - Update `apps/webapp/src/routes/__root.tsx` to call `useDocumentTitle(siteInfo?.name)` after `config.siteInfo` query resolves
   - Keep static `<title>Shared Spaces</title>` fallback in `index.html`

7. **Phase 7: Verification & Polish**
   - Manual verification on Android Chrome: install prompt appears, app installs, opens in standalone, icon and short name correct
   - Manual verification on iOS Safari: "Add to Home Screen" works, apple-touch-icon shows, app opens in standalone, status bar style correct
   - Run `bun run lint:fix`, `bun run typecheck`, `bun test` from root
   - Run `/task-code-review`, `/task-tests-review`, `/task-architecture-review`, `/task-frontend-review`
   - Address all findings from review tasks
   - Re-run validation trio after review fixes

8. **Phase 8: Documentation**
   - Update `apps/webapp/README.md` with PWA install flow section
   - Document new env vars: `SITE_SHORT_NAME` (optional, ≤12 chars, defaults to truncated `SITE_NAME`), `SITE_WEBAPP_URL` (required, webapp origin for manifest icon URLs)
   - Document icon replacement procedure: "To customize PWA icons, replace the placeholder PNGs in `apps/webapp/public/` with branded artwork. Maintain the specified dimensions and formats."
   - Add note: "Changing site name requires reinstalling the PWA on already-installed devices (browsers freeze the home-screen name at install time)."

**Rollback:** If critical issues arise, remove the manifest link from `index.html` and redeploy. The manifest endpoint can remain (it's harmless if not linked). If the `shortName` field in `config.siteInfo` breaks the frontend, revert the tRPC procedure change and redeploy the api.

## Open Questions

**Q:** Should the manifest `background_color` and `theme_color` be configurable via env vars, or hardcoded to the default theme colors?
→ **Decision:** Hardcode to the default theme colors (`oklch(1 0 0)` for light, `oklch(0.145 0 0)` for dark). Configurability is out of scope; deployments that need custom colors can fork the manifest endpoint.

**Q:** Should the manifest `start_url` include a query parameter (e.g., `/?source=pwa`) to track PWA installs in analytics?
→ **Decision:** No. The app has no analytics yet; adding a query parameter is premature. A follow-up change can introduce this if analytics are added.

**Q:** Should the manifest `scope` be set to `"/"` to allow navigation to any route, or restricted to a specific path?
→ **Decision:** Omit `scope` (defaults to `"/"` per spec). The entire webapp is in scope; no need to restrict.

**Q:** Should the manifest `orientation` be set to `"portrait"` to lock the screen orientation on mobile?
→ **Decision:** No. Let the user rotate their device freely; locking orientation is annoying for users who prefer landscape.
