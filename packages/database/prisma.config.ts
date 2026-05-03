import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

// Resolve DATABASE_URL relative to project root (two levels up from packages/database)
const here = dirname(fileURLToPath(import.meta.url))
let databaseUrl = process.env.DATABASE_URL || 'file:./data/app.db'
if (databaseUrl.startsWith('file:./')) {
  const relativePath = databaseUrl.replace('file:./', '')
  const absolutePath = resolve(here, '../..', relativePath)
  databaseUrl = `file:${absolutePath}`
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
