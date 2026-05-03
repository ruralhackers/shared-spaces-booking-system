import type { Elysia } from 'elysia'
import type { BrandingConfig } from '../branding.config'

interface ManifestRouteOptions {
  brandingConfig: BrandingConfig
  webappUrl: string
}

export function registerManifestRoute(app: Elysia, options: ManifestRouteOptions) {
  return app.get('/manifest.webmanifest', () => {
    const manifest = {
      name: options.brandingConfig.name,
      short_name: options.brandingConfig.shortName,
      description: `Reserva espacios compartidos en ${options.brandingConfig.shortName}`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#000000',
      categories: ['productivity', 'lifestyle'],
      icons: [
        {
          src: `${options.webappUrl}/icon-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: `${options.webappUrl}/icon-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: `${options.webappUrl}/icon-maskable-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    }

    return new Response(JSON.stringify(manifest), {
      headers: {
        'Content-Type': 'application/manifest+json'
      }
    })
  })
}
