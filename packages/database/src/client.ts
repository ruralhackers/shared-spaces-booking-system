import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../prisma/generated/client'
import { initializeSqlitePragmas } from './sqlite-init'

// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client
const isServer = typeof (globalThis as { window?: unknown }).window === 'undefined'
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Project root: two levels up from packages/database/src/
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function resolveDatabasePath(): string {
  const raw = process.env.DATABASE_URL?.replace('file:', '') ?? './data/app.db'
  return raw.startsWith('/') ? raw : resolve(projectRoot, raw)
}

async function createClient(): Promise<PrismaClient> {
  const dbPath = resolveDatabasePath()
  mkdirSync(dirname(dbPath), { recursive: true })
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })
  await initializeSqlitePragmas(prisma)
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

export { Prisma, PrismaClient } from '../prisma/generated/client'
