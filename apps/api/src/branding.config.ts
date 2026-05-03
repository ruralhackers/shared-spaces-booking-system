export interface BrandingConfig {
  name: string
  shortName: string
  logoUrl: string | null
}

interface BrandingInput {
  name: string
  shortName: string | undefined
  logoUrl: string | null
}

export function createBrandingConfig(input: BrandingInput): BrandingConfig {
  // SITE_SHORT_NAME length is enforced by env.ts (z.string().max(12)).
  const shortName = input.shortName ?? input.name.slice(0, 12).trimEnd()

  return {
    name: input.name,
    shortName,
    logoUrl: input.logoUrl
  }
}
