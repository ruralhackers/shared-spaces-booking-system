import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Elysia } from 'elysia'
import { createBrandingConfig } from '../branding.config'
import { registerManifestRoute } from './manifest.route'

describe('The manifest endpoint', () => {
  let app: Elysia
  let baseUrl: string

  beforeAll(async () => {
    const brandingConfig = createBrandingConfig({
      name: 'Test Space',
      shortName: undefined,
      logoUrl: null
    })

    app = new Elysia().get('/', () => ({ ok: true }))

    registerManifestRoute(app, {
      brandingConfig,
      webappUrl: 'http://localhost:3000'
    })

    app.listen(0)

    baseUrl = `http://${app.server?.hostname}:${app.server?.port}`
  })

  afterAll(() => {
    app.stop()
  })

  test('returns HTTP 200', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)

    expect(response.status).toBe(200)
  })

  test('returns application/manifest+json content type', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)

    expect(response.headers.get('content-type')).toContain('application/manifest+json')
  })

  test('manifest name reflects SITE_NAME env var', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)
    const manifest = await response.json()

    expect(manifest.name).toBe('Test Space')
  })

  test('manifest short_name reflects SITE_SHORT_NAME env var', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)
    const manifest = await response.json()

    expect(manifest.short_name).toBe('Test Space')
  })

  test('includes three icon definitions', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)
    const manifest = await response.json()

    expect(manifest.icons).toBeArrayOfSize(3)
  })

  test('icon URLs are absolute and use SITE_WEBAPP_URL', async () => {
    const response = await fetch(`${baseUrl}/manifest.webmanifest`)
    const manifest = await response.json()

    expect(manifest.icons[0].src).toBe('http://localhost:3000/icon-192.png')
  })
})
