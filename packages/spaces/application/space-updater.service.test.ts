import { describe, expect, test } from 'bun:test'
import { ValidationError } from '@dfs/common'
import { SpaceNotFoundError } from '../domain/errors'
import { Space } from '../domain/space.entity'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceUpdater } from './space-updater.service'

const validOpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

function makeSpace(slug: string) {
  return Space.create({
    slug,
    name: 'Original Name',
    description: 'Original desc.',
    openHours: validOpenHours
  })
}

describe('The SpaceUpdater service', () => {
  test('updates space name', async () => {
    const repo = new InMemorySpaceRepository()
    const space = makeSpace('my-space')
    await repo.save(space)
    const updater = new SpaceUpdater(repo)

    const dto = await updater.run({ slug: 'my-space', name: 'New Name' })

    expect(dto.displayName).toBe('New Name')
    expect(dto.slug).toBe('my-space')
  })

  test('updates space color', async () => {
    const repo = new InMemorySpaceRepository()
    await repo.save(makeSpace('my-space'))
    const updater = new SpaceUpdater(repo)

    const dto = await updater.run({ slug: 'my-space', color: '#ef4444' })

    expect(dto.color).toBe('#ef4444')
  })

  test('removes color by setting to null', async () => {
    const repo = new InMemorySpaceRepository()
    const space = Space.create({
      slug: 'my-space',
      name: 'Original Name',
      description: 'Original desc.',
      openHours: validOpenHours,
      color: '#ef4444'
    })
    await repo.save(space)
    const updater = new SpaceUpdater(repo)

    const dto = await updater.run({ slug: 'my-space', color: null })

    expect(dto.color).toBeNull()
  })

  test('updates space description', async () => {
    const repo = new InMemorySpaceRepository()
    await repo.save(makeSpace('my-space'))
    const updater = new SpaceUpdater(repo)

    const dto = await updater.run({ slug: 'my-space', description: 'New desc.' })

    expect(dto.description).toBe('New desc.')
  })

  test('updates space open hours', async () => {
    const repo = new InMemorySpaceRepository()
    await repo.save(makeSpace('my-space'))
    const updater = new SpaceUpdater(repo)
    const newHours = {
      ...validOpenHours,
      mon: [{ start: '09:00', end: '18:00' }]
    }

    const dto = await updater.run({ slug: 'my-space', openHours: newHours })

    expect(dto.openHours.mon).toEqual([{ start: '09:00', end: '18:00' }])
  })

  test('validates open hours on update', async () => {
    const repo = new InMemorySpaceRepository()
    await repo.save(makeSpace('my-space'))
    const updater = new SpaceUpdater(repo)
    const badHours = { ...validOpenHours, mon: [{ start: '18:00', end: '09:00' }] }

    await expect(updater.run({ slug: 'my-space', openHours: badHours })).rejects.toThrow(
      ValidationError
    )
  })

  test('fails when space does not exist', async () => {
    const repo = new InMemorySpaceRepository()
    const updater = new SpaceUpdater(repo)

    await expect(updater.run({ slug: 'unknown', name: 'X' })).rejects.toThrow(SpaceNotFoundError)
  })

  test('validates name length', async () => {
    const repo = new InMemorySpaceRepository()
    await repo.save(makeSpace('my-space'))
    const updater = new SpaceUpdater(repo)

    await expect(updater.run({ slug: 'my-space', name: 'A' })).rejects.toThrow(ValidationError)
  })
})
