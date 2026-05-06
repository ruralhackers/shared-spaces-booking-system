import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { PrismaClient } from '../prisma/generated/client'

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client
const isServer = typeof (globalThis as { window?: unknown }).window === 'undefined'
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Project root: two levels up from packages/database/src/
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

let activePglite: PGlite | undefined

function resolveDatabasePath(): string {
  const raw = process.env.DATABASE_URL?.replace('pglite:', '') ?? './data/pglite'
  return raw.startsWith('/') ? raw : resolve(projectRoot, raw)
}

async function createClient(): Promise<PrismaClient> {
  const dataDir = resolveDatabasePath()
  mkdirSync(dirname(dataDir), { recursive: true })
  const pglite = new PGlite({ dataDir })
  activePglite = pglite
  const adapter = new PrismaPGlite(pglite)
  const prisma = new PrismaClient({ adapter })
  return prisma
}

function createBrowserStub(): PrismaClient {
  throw new Error('PrismaClient is server-only')
}

export const client: PrismaClient = isServer
  ? (globalForPrisma.prisma ?? (await createClient()))
  : createBrowserStub()

if (isServer && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client
}

if (isServer) {
  const shutdown = async () => {
    await client.$disconnect()
    await activePglite?.close()
    process.exit(0)
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

export { Prisma, PrismaClient } from '../prisma/generated/client'
