# PWA Installation Guide

This document explains how users can install the Shared Spaces Booking app as a Progressive Web App (PWA) on different devices.

---

## Android Installation

### Chrome / Edge / Samsung Internet

1. **Visit the webapp** in your browser (e.g., `https://salas.espacioarroelo.es`)
2. **Look for the install prompt** — a banner or popup will appear automatically saying "Add to Home Screen" or "Install app"
3. **Tap "Install"** or "Add"
4. The app icon will appear on your home screen
5. **Launch the app** from your home screen — it will open in standalone mode (no browser UI)

### Manual Installation (if prompt doesn't appear)

1. Open the **browser menu** (three dots in the top-right)
2. Select **"Add to Home Screen"** or **"Install app"**
3. Confirm the installation
4. The app will be added to your home screen

---

## iOS Installation (Safari)

**Note:** iOS does not show automatic install prompts for PWAs. Users must manually add the app to their home screen.

### Steps

1. **Visit the webapp** in Safari (e.g., `https://salas.espacioarroelo.es`)
2. **Tap the Share button** (square with arrow pointing up) at the bottom of the screen
3. **Scroll down** and tap **"Add to Home Screen"**
4. **Edit the name** if desired (defaults to the app's short name)
5. **Tap "Add"** in the top-right corner
6. The app icon will appear on your home screen
7. **Launch the app** from your home screen — it will open in standalone mode

### iOS Limitations

- No automatic install prompt (Apple policy)
- Must use Safari (Chrome/Firefox on iOS cannot install PWAs)
- The app name shown is from the manifest's `short_name` field
- The icon used is the `apple-touch-icon.png` (180x180px)

---

## Desktop Installation

### Chrome / Edge / Brave

1. **Visit the webapp** in your browser
2. **Look for the install icon** in the address bar (⊕ or computer icon)
3. **Click the icon** and select "Install"
4. The app will open in a standalone window
5. **Launch the app** from your OS app launcher or taskbar

### Manual Installation

1. Open the **browser menu** (three dots)
2. Select **"Install [App Name]"** or **"Create shortcut"**
3. Check **"Open as window"** if available
4. Confirm the installation

---

## Verifying Installation

After installation, the app should:

- ✅ Open in **standalone mode** (no browser address bar or tabs)
- ✅ Show the **app icon** on your home screen / app drawer / taskbar
- ✅ Use the **app name** from the manifest (not the page title)
- ✅ Display the **theme color** in the status bar (Android) or title bar (desktop)
- ✅ Work **offline** (if service worker is implemented)

---

## Troubleshooting

### Install prompt doesn't appear (Android)

**Possible causes:**
- The app is already installed
- The browser doesn't support PWA installation
- The manifest is missing or invalid
- The site is not served over HTTPS

**Solutions:**
1. Check if the app is already installed (look in app drawer)
2. Try the manual installation method (browser menu → "Add to Home Screen")
3. Verify the manifest is accessible: `https://your-domain.com/manifest.webmanifest`
4. Check browser console for errors (F12 → Console)

### iOS: "Add to Home Screen" option is missing

**Possible causes:**
- Not using Safari (must use Safari on iOS)
- The manifest link is missing from the HTML
- The apple-touch-icon is missing

**Solutions:**
1. Ensure you're using Safari (not Chrome or Firefox)
2. Verify the manifest link is in the HTML: `<link rel="manifest" href="...">`
3. Verify the apple-touch-icon exists: `https://your-domain.com/apple-touch-icon.png`

### App opens in browser instead of standalone mode

**Possible causes:**
- The manifest `display` field is not set to `standalone`
- The app was opened from a browser bookmark instead of the home screen icon
- iOS: the app was not added via "Add to Home Screen"

**Solutions:**
1. Verify the manifest has `"display": "standalone"`
2. Launch the app from the home screen icon (not from a browser bookmark)
3. On iOS: re-add the app using Safari's "Add to Home Screen" feature

---

## Technical Requirements

For the PWA to be installable, the following must be true:

### Required Files

- ✅ `manifest.webmanifest` — served at `/manifest.webmanifest`
- ✅ `icon-192.png` — 192x192px app icon
- ✅ `icon-512.png` — 512x512px app icon
- ✅ `icon-maskable-512.png` — 512x512px maskable icon (for Android adaptive icons)
- ✅ `apple-touch-icon.png` — 180x180px icon for iOS
- ✅ `favicon.ico` — browser tab icon

### Manifest Requirements

```json
{
  "name": "Full App Name",
  "short_name": "Short Name",
  "description": "App description",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### HTML Requirements

```html
<!-- Manifest link -->
<link rel="manifest" href="/manifest.webmanifest">

<!-- iOS-specific -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Short Name">

<!-- Android-specific -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="Short Name">

<!-- Theme color -->
<meta name="theme-color" content="#000000">

<!-- Viewport (required for mobile) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### HTTPS Requirement

- ✅ The site **must** be served over HTTPS (except for `localhost` during development)
- ✅ SSL certificate must be valid (not self-signed)

---

## Testing PWA Installation

### Chrome DevTools (Desktop)

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Manifest** in the left sidebar
4. Verify all fields are correct
5. Check for errors or warnings

### Lighthouse (Desktop/Mobile)

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Generate report**
5. Review the PWA checklist

### Android Chrome DevTools

1. Connect your Android device via USB
2. Enable USB debugging on the device
3. Open `chrome://inspect` on your desktop Chrome
4. Inspect the page on your device
5. Check the **Application** tab → **Manifest**

---

## User Instructions (for end users)

### Android

> **Para instalar la app en tu móvil:**
> 
> 1. Abre la web en Chrome o tu navegador predeterminado
> 2. Busca el mensaje "Añadir a pantalla de inicio" o "Instalar app"
> 3. Pulsa "Instalar" o "Añadir"
> 4. La app aparecerá en tu pantalla de inicio
> 
> Si no aparece el mensaje, abre el menú del navegador (tres puntos) y selecciona "Añadir a pantalla de inicio".

### iOS

> **Para instalar la app en tu iPhone/iPad:**
> 
> 1. Abre la web en Safari (no funciona en Chrome)
> 2. Pulsa el botón de compartir (cuadrado con flecha hacia arriba)
> 3. Desplázate hacia abajo y pulsa "Añadir a pantalla de inicio"
> 4. Pulsa "Añadir" en la esquina superior derecha
> 5. La app aparecerá en tu pantalla de inicio

---

## References

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: Install criteria](https://web.dev/install-criteria/)
- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
