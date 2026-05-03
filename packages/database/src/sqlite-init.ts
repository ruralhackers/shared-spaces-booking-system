import type { PrismaClient } from '../prisma/generated/client'

export async function initializeSqlitePragmas(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
  await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL')
}
