import { client as prisma } from '@dfs/database'

const globalForPrisma = globalThis as unknown as {
  prisma: typeof prisma | undefined
}

export const db = globalForPrisma.prisma ?? prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
