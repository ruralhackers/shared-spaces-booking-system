## ADDED Requirements

### Requirement: The system SHALL expose a Web App Manifest endpoint

The api SHALL expose a public HTTP route `GET /manifest.webmanifest` that returns a Web App Manifest with `Content-Type: application/manifest+json`. The manifest SHALL include: `name` (from site branding), `short_name` (from site branding), `start_url: "/"`, `display: "standalone"`, `background_color`, `theme_color`, and an `icons` array referencing `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` by absolute URL pointing at the webapp origin.

#### Scenario: Manifest is served with correct content type

- **WHEN** a client GETs `/manifest.webmanifest`
- **THEN** the response has `Content-Type: application/manifest+json` and HTTP 200

#### Scenario: Manifest reflects configured site name

- **WHEN** `SITE_NAME` is `"Casa Verde"`
- **THEN** the manifest `name` field is `"Casa Verde"`

#### Scenario: Manifest reflects configured short name

- **WHEN** `SITE_SHORT_NAME` is `"Verde"`
- **THEN** the manifest `short_name` field is `"Verde"`

#### Scenario: Manifest icons reference absolute webapp URLs

- **WHEN** the manifest is fetched
- **THEN** each entry in `icons[].src` is an absolute URL using the configured webapp origin

#### Scenario: Manifest declares standalone display

- **WHEN** the manifest is fetched
- **THEN** the `display` field equals `"standalone"`

### Requirement: The webapp index.html SHALL declare PWA install metadata

The webapp `index.html` SHALL declare PWA install metadata so mobile browsers offer installation. This includes: `<link rel="manifest" href="${apiUrl}/manifest.webmanifest" crossorigin="use-credentials">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, two `<meta name="theme-color">` tags scoped by `(prefers-color-scheme: light)` and `(prefers-color-scheme: dark)`, `<meta name="apple-mobile-web-app-capable" content="yes">`, and `<meta name="apple-mobile-web-app-status-bar-style" content="default">`.

#### Scenario: Manifest link points at api endpoint

- **WHEN** the page loads
- **THEN** `<link rel="manifest">` exists with an href ending in `/manifest.webmanifest` and `crossorigin="use-credentials"`

#### Scenario: Apple touch icon is declared

- **WHEN** the page loads on iOS Safari
- **THEN** `<link rel="apple-touch-icon">` resolves to a 180×180 PNG

#### Scenario: Theme color adapts to color scheme

- **WHEN** the user's OS is in dark mode
- **THEN** the dark-mode `<meta name="theme-color">` value applies

#### Scenario: App is marked as web-app capable

- **WHEN** the page loads
- **THEN** `<meta name="apple-mobile-web-app-capable" content="yes">` is present

### Requirement: The webapp SHALL ship with static icon assets

The webapp SHALL ship with the following static icon files in `apps/webapp/public/`: `icon-192.png` (192×192, any-purpose), `icon-512.png` (512×512, any-purpose), `icon-maskable-512.png` (512×512, maskable), and `apple-touch-icon.png` (180×180). All icons SHALL be PNGs.

#### Scenario: Standard icons are available at fixed paths

- **WHEN** a client requests `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, or `/apple-touch-icon.png`
- **THEN** each file is served as a PNG with HTTP 200

#### Scenario: Maskable icon is declared with maskable purpose

- **WHEN** the manifest is fetched
- **THEN** the `icon-maskable-512.png` entry has `"purpose": "maskable"`

#### Scenario: Standard icons are declared with any purpose

- **WHEN** the manifest is fetched
- **THEN** the 192 and 512 standard icon entries have `"purpose": "any"`

### Requirement: The webapp SHALL set document title to the configured site name

The webapp SHALL set `document.title` to the configured site name (`config.siteInfo.name`) once that query resolves. The static fallback title in `index.html` SHALL be `"Shared Spaces"` so the title is never empty during the initial page load.

#### Scenario: Static fallback title before config resolves

- **WHEN** the page is first served and JavaScript has not yet executed
- **THEN** `<title>` contains `"Shared Spaces"`

#### Scenario: Title updates after config loads

- **WHEN** `config.siteInfo` resolves with `name: "Casa Verde"`
- **THEN** `document.title` becomes `"Casa Verde"`

### Requirement: The installed PWA SHALL open in standalone mode

When a user installs the PWA via the browser's install prompt, the app SHALL launch without browser chrome (no URL bar, no tabs) because `display: standalone` is declared in the manifest.

#### Scenario: Installed app opens without browser chrome

- **WHEN** a user installs the PWA on Android Chrome and launches it from the home screen
- **THEN** the app opens in a standalone window without the address bar

#### Scenario: start_url is the application root

- **WHEN** the user launches the installed app
- **THEN** it opens at `/`
