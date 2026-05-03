import { describe, expect, test } from 'bun:test'
import { createBrandingConfig } from './branding.config'

describe('The BrandingConfig', () => {
  test('derives shortName from name when SITE_SHORT_NAME is not set', () => {
    const config = createBrandingConfig({
      name: 'Shared Spaces',
      shortName: undefined,
      logoUrl: null
    })

    expect(config.shortName).toBe('Shared Space')
  })

  test('uses custom SITE_SHORT_NAME when provided', () => {
    const config = createBrandingConfig({
      name: 'Casa Verde Coliving',
      shortName: 'Verde',
      logoUrl: null
    })

    expect(config.shortName).toBe('Verde')
  })

  test('allows SITE_SHORT_NAME exactly 12 chars (boundary case)', () => {
    const config = createBrandingConfig({
      name: 'Some Long Name',
      shortName: 'Twelve Chars',
      logoUrl: null
    })

    expect(config.shortName).toBe('Twelve Chars')
    expect(config.shortName.length).toBe(12)
  })
})
