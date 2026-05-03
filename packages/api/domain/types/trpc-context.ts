import type { SpacesServices } from '@dfs/spaces'

export interface SiteConfig {
  name: string
  shortName: string
  logoUrl: string | null
  tz: string
}

export interface TRPCContext {
  spacesServices: SpacesServices
  isAdmin: boolean
  siteConfig: SiteConfig
  config: {
    tz: string
  }
}
