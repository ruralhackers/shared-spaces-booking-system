import { mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../prisma/generated/client'
import { initializeSqlitePragmas } from './sqlite-init'

const here = dirname(fileURLToPath(import.meta.url))
const schemaSqlPath = join(here, '..', 'prisma', 'schema.sql')

export interface TestPrisma {
  client: PrismaClient
  close: () => Promise<void>
}

let testDbCounter = 0

export async function createTestPrisma(): Promise<TestPrisma> {
  // Create temporary directory for test database
  const tmpDir = mkdtempSync(join(tmpdir(), 'prisma-test-'))
  const dbPath = join(tmpDir, `test-${Date.now()}-${testDbCounter++}.db`)

  // Create adapter factory with local file URL
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const client = new PrismaClient({ adapter })

  // Connect to database
  await client.$connect()

  // Initialize SQLite pragmas
  await initializeSqlitePragmas(client)

  // Load and execute schema
  const schemaSql = await readFile(schemaSqlPath, 'utf8')

  // Split schema into individual statements and execute each
  // Remove comments first, then split by semicolon
  const cleanedSql = schemaSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements = cleanedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement)
  }

  return {
    client,
    async close() {
      await client.$disconnect()
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }
}
