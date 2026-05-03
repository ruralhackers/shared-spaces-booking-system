import { timingSafeEqual } from 'node:crypto'
import { SystemClock } from '@dfs/common'
import { NotifierFactory } from '@dfs/notifications'
import { SpacesServicesFactory } from '@dfs/spaces'
import { createBrandingConfig } from './branding.config.ts'
import { db } from './db.ts'
import { env } from './env.ts'
import { consoleLogger } from './logger.ts'

const clock = new SystemClock()
const notifier = NotifierFactory.create(env.SLACK_WEBHOOK_URL, consoleLogger)
const spacesServices = SpacesServicesFactory.create(db, clock, notifier, env.TZ)

export const brandingConfig = createBrandingConfig({
  name: env.SITE_NAME,
  shortName: env.SITE_SHORT_NAME,
  logoUrl: env.SITE_LOGO_URL ?? null
})

function isAdminKeyValid(provided: string, expected: string): boolean {
  if (provided.length === 0 || provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const adminKey = opts.headers.get('x-admin-key') ?? ''
  const isAdmin = isAdminKeyValid(adminKey, env.ADMIN_KEY)

  return {
    spacesServices,
    isAdmin,
    siteConfig: {
      ...brandingConfig,
      tz: env.TZ
    },
    config: {
      tz: env.TZ
    }
  }
}
