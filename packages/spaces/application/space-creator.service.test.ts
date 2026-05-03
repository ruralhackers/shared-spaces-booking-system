import { describe, expect, test } from 'bun:test'
import { ValidationError } from '@dfs/common'
import { SpaceSlugCollisionError } from '../domain/errors'
import { InMemorySpaceRepository } from '../infrastructure/space-in-memory.repository'
import { SpaceCreator } from './space-creator.service'

const validOpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

describe('The SpaceCreator service', () => {
  test('creates a space with an auto-generated slug', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)

    const dto = await creator.run({
      name: 'Chill House',
      description: 'A lounge.',
      openHours: validOpenHours
    })

    expect(dto.slug).toBe('chill-house')
    expect(dto.displayName).toBe('Chill House')
    expect(dto.color).toBeNull()
  })

  test('creates a space with a color', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)

    const dto = await creator.run({
      name: 'Chill House',
      description: 'A lounge.',
      openHours: validOpenHours,
      color: '#3b82f6'
    })

    expect(dto.color).toBe('#3b82f6')
  })

  test('handles slug collision by appending -2', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)
    await creator.run({ name: 'Chill House', description: '', openHours: validOpenHours })

    const second = await creator.run({
      name: 'Chill House',
      description: '',
      openHours: validOpenHours
    })

    expect(second.slug).toBe('chill-house-2')
  })

  test('handles multiple collisions by appending -3, -4, etc.', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)
    await creator.run({ name: 'Sala', description: '', openHours: validOpenHours })
    await creator.run({ name: 'Sala', description: '', openHours: validOpenHours })

    const third = await creator.run({ name: 'Sala', description: '', openHours: validOpenHours })

    expect(third.slug).toBe('sala-3')
  })

  test('stops after 100 collision attempts', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)
    const { Space } = await import('../domain/space.entity')

    // Pre-fill slugs: 'x', 'x-2' ... 'x-100'
    const base = Space.create({
      slug: 'x',
      name: 'X Space',
      description: '',
      openHours: validOpenHours
    })
    await repo.save(base)
    for (let i = 2; i <= 100; i++) {
      const s = Space.create({
        slug: `x-${i}`,
        name: `X Space ${i}`,
        description: '',
        openHours: validOpenHours
      })
      await repo.save(s)
    }

    await expect(
      creator.run({ name: 'X', description: '', openHours: validOpenHours })
    ).rejects.toThrow(SpaceSlugCollisionError)
  })

  test('validates name length', async () => {
    const repo = new InMemorySpaceRepository()
    const creator = new SpaceCreator(repo)

    await expect(
      creator.run({ name: 'A', description: '', openHours: validOpenHours })
    ).rejects.toThrow(ValidationError)
  })
})
