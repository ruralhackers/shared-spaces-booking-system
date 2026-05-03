## ADDED Requirements

### Requirement: The system SHALL expose per-deployment site branding via environment variables

The system SHALL read `SITE_NAME` and `SITE_LOGO_URL` from environment variables at startup. `SITE_NAME` defaults to `"Shared Spaces"` if not set. `SITE_LOGO_URL` is optional and defaults to `null` (no logo).

The system SHALL expose a public tRPC procedure `config.siteInfo` that returns `{ name: string, logoUrl: string | null }`.

#### Scenario: Default site name when env var is not set

- **WHEN** the `SITE_NAME` environment variable is not set
- **THEN** `config.siteInfo` returns `{ name: "Shared Spaces", logoUrl: null }`

#### Scenario: Custom site name from env var

- **WHEN** the `SITE_NAME` environment variable is set to `"Creative Hub"`
- **THEN** `config.siteInfo` returns `{ name: "Creative Hub", ... }`

#### Scenario: Logo URL from env var

- **WHEN** the `SITE_LOGO_URL` environment variable is set to `"https://example.com/logo.png"`
- **THEN** `config.siteInfo` returns `{ ..., logoUrl: "https://example.com/logo.png" }`

#### Scenario: No logo when env var is not set

- **WHEN** the `SITE_LOGO_URL` environment variable is not set
- **THEN** `config.siteInfo` returns `{ ..., logoUrl: null }`

### Requirement: The webapp SHALL render site branding in the navigation header

The webapp SHALL fetch `config.siteInfo` on load and render the site name in the navigation header. If a logo URL is provided, the webapp SHALL render the logo as an image before the site name. The logo and name SHALL link to the homepage (`/`).

The webapp SHALL cache the site info aggressively (staleTime: Infinity) since it does not change during a session.

#### Scenario: Site name displayed in nav

- **WHEN** a user loads any page
- **THEN** the navigation header displays the site name from `config.siteInfo`

#### Scenario: Logo displayed when URL is set

- **WHEN** `config.siteInfo` returns a non-null `logoUrl`
- **THEN** the navigation header displays an `<img>` element with that URL before the site name

#### Scenario: No logo displayed when URL is null

- **WHEN** `config.siteInfo` returns `logoUrl: null`
- **THEN** the navigation header displays only the site name, no image element

#### Scenario: Clicking logo or name navigates to homepage

- **WHEN** a user clicks the logo or site name in the navigation header
- **THEN** the webapp navigates to `/`

#### Scenario: Broken logo URL shows broken image

- **WHEN** the `logoUrl` points to a non-existent or inaccessible image
- **THEN** the browser displays its default broken image indicator (no server-side validation)
