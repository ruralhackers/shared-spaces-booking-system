import { describe, expect, test } from 'bun:test'
import { SpaceNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceDeleter } from './space-deleter.service'

const validOpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

describe('The SpaceDeleter service', () => {
  test('deletes an existing space', async () => {
    const repo = new InMemorySpaceRepository()
    const space = Space.create({
      slug: 'my-space',
      name: 'My Space',
      description: '',
      openHours: validOpenHours
    })
    await repo.save(space)
    const deleter = new SpaceDeleter(repo)

    const result = await deleter.run({ slug: 'my-space' })

    expect(result.deleted).toBe(true)
    expect(await repo.findBySlug('my-space')).toBeNull()
  })

  test('fails when space does not exist', async () => {
    const repo = new InMemorySpaceRepository()
    const deleter = new SpaceDeleter(repo)

    await expect(deleter.run({ slug: 'unknown' })).rejects.toThrow(SpaceNotFoundError)
  })
})
