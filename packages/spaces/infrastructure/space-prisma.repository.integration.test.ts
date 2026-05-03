import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { createTestPrisma, type TestPrisma } from '@dfs/database/testing'
import { SpacePrismaRepository } from './space-prisma.repository'

let db: TestPrisma

beforeAll(async () => {
  db = await createTestPrisma()
})

afterAll(async () => {
  await db.close()
})

describe('The SpacePrismaRepository', () => {
  test('returns null for unknown slug', async () => {
    const repo = new SpacePrismaRepository(db.client)

    const result = await repo.findBySlug('unknown')

    expect(result).toBeNull()
  })

  test('persists and retrieves space by slug', async () => {
    const repo = new SpacePrismaRepository(db.client)
    await db.client.space.create({
      data: {
        slug: 'test-space',
        displayName: 'Test Space',
        description: 'A test space',
        openHours: {
          mon: [{ start: '00:00', end: '24:00' }],
          tue: [],
          wed: [],
          thu: [],
          fri: [],
          sat: [],
          sun: []
        }
      }
    })

    const result = await repo.findBySlug('test-space')

    expect(result).not.toBeNull()
    expect(result?.toDto().slug).toBe('test-space')
  })

  test('lists all spaces', async () => {
    const repo = new SpacePrismaRepository(db.client)

    const all = await repo.listAll()

    expect(all.length).toBeGreaterThanOrEqual(1)
  })
})
