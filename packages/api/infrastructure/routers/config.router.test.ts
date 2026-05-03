import { describe, expect, test } from 'bun:test'
import type { SpacesServices } from '@dfs/spaces'
import { configRouter } from './config.router'

describe('The site info endpoint', () => {
  test('returns site name', async () => {
    const caller = configRouter.createCaller({
      spacesServices: {} as SpacesServices,
      isAdmin: false,
      siteConfig: {
        name: 'Shared Spaces',
        shortName: 'Shared Space',
        logoUrl: null,
        tz: 'Europe/Madrid'
      },
      config: {
        tz: 'Europe/Madrid'
      }
    })

    const result = await caller.siteInfo()

    expect(result.name).toBe('Shared Spaces')
  })

  test('returns shortName derived from default name', async () => {
    const caller = configRouter.createCaller({
      spacesServices: {} as SpacesServices,
      isAdmin: false,
      siteConfig: {
        name: 'Shared Spaces',
        shortName: 'Shared Space',
        logoUrl: null,
        tz: 'Europe/Madrid'
      },
      config: {
        tz: 'Europe/Madrid'
      }
    })

    const result = await caller.siteInfo()

    expect(result.shortName).toBe('Shared Space')
  })

  test('returns custom shortName from env', async () => {
    const caller = configRouter.createCaller({
      spacesServices: {} as SpacesServices,
      isAdmin: false,
      siteConfig: {
        name: 'Casa Verde Coliving',
        shortName: 'Verde',
        logoUrl: null,
        tz: 'Europe/Madrid'
      },
      config: {
        tz: 'Europe/Madrid'
      }
    })

    const result = await caller.siteInfo()

    expect(result.shortName).toBe('Verde')
  })

  test('returns logoUrl when configured', async () => {
    const caller = configRouter.createCaller({
      spacesServices: {} as SpacesServices,
      isAdmin: false,
      siteConfig: {
        name: 'Shared Spaces',
        shortName: 'Shared Space',
        logoUrl: null,
        tz: 'Europe/Madrid'
      },
      config: {
        tz: 'Europe/Madrid'
      }
    })

    const result = await caller.siteInfo()

    expect(result.logoUrl).toBe(null)
  })
})
