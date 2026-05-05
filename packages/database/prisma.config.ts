import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

// Resolve DATABASE_URL relative to project root (two levels up from packages/database)
const here = dirname(fileURLToPath(import.meta.url))
let databaseUrl = process.env.DATABASE_URL || 'pglite:./data/pglite'
if (databaseUrl.startsWith('pglite:./')) {
  const relativePath = databaseUrl.replace('pglite:./', '')
  const absolutePath = resolve(here, '../..', relativePath)
  databaseUrl = `pglite:${absolutePath}`
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: databaseUrl
  }
})
