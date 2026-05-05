import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { PrismaClient } from '../prisma/generated/client'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..', '..', '..')
const schemaSqlPath = join(here, '..', 'prisma', 'schema.sql')

function resolveDatabasePath(): string {
  const raw = process.env.DATABASE_URL?.replace('pglite:', '') ?? './data/pglite'
  return raw.startsWith('/') ? raw : resolve(projectRoot, raw)
}

async function main() {
  const dataDir = resolveDatabasePath()
  console.log(`Initializing PGlite schema at: ${dataDir}`)

  const pglite = new PGlite({ dataDir })
  const adapter = new PrismaPGlite(pglite)
  const client = new PrismaClient({ adapter })

  await client.$connect()

  // Load and execute schema
  const schemaSql = await readFile(schemaSqlPath, 'utf8')

  // Split schema into individual statements and execute each
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

  await client.$disconnect()
  await pglite.close()

  console.log('Schema initialized successfully!')
}

main().catch((e) => {
  console.error('Schema initialization failed:', e)
  process.exit(1)
})
