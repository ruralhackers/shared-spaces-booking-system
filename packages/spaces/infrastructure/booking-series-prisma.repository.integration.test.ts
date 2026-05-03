import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { FixedClock } from '@dfs/common'
import { createTestPrisma, type TestPrisma } from '@dfs/database/testing'
import { BookingSeries } from '../domain/booking-series.entity'
import { RecurrenceFrequency } from '../domain/recurrence-frequency.vo'
import { BookingSeriesPrismaRepository } from './booking-series-prisma.repository'

describe('The BookingSeriesPrismaRepository', () => {
  let db: TestPrisma
  let repository: BookingSeriesPrismaRepository
  const clock = new FixedClock(new Date('2026-06-01T00:00:00Z'))

  beforeAll(async () => {
    db = await createTestPrisma()
    repository = new BookingSeriesPrismaRepository(db.client)

    // Seed a space for FK
    await db.client.space.create({
      data: {
        id: 'space-1',
        slug: 'test-space',
        displayName: 'Test Space',
        description: 'Test',
        openHours: {
          mon: [{ start: '00:00', end: '24:00' }],
          tue: [{ start: '00:00', end: '24:00' }],
          wed: [{ start: '00:00', end: '24:00' }],
          thu: [{ start: '00:00', end: '24:00' }],
          fri: [{ start: '00:00', end: '24:00' }],
          sat: [{ start: '00:00', end: '24:00' }],
          sun: [{ start: '00:00', end: '24:00' }]
        }
      }
    })
  })

  beforeEach(async () => {
    // Clean up booking series between tests
    await db.client.bookingSeries.deleteMany({})
  })

  afterAll(async () => {
    await db.close()
  })

  test('saves and retrieves a booking series by ID', async () => {
    // Arrange
    const series = BookingSeries.create({
      spaceId: 'space-1',
      bookerName: 'Alice',
      frequency: RecurrenceFrequency.create('daily'),
      startTime: '10:00',
      endTime: '11:00',
      firstDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2026-06-07T23:59:59Z'),
      clock
    })

    // Act
    await repository.save(series)
    const found = await repository.findById(series.toDto().id)

    // Assert
    expect(found).not.toBeNull()
    expect(found?.toDto().id).toBe(series.toDto().id)
    expect(found?.toDto().spaceId).toBe('space-1')
    expect(found?.toDto().bookerName).toBe('Alice')
    expect(found?.toDto().frequency).toBe('daily')
    expect(found?.toDto().startTime).toBe('10:00')
    expect(found?.toDto().endTime).toBe('11:00')
  })

  test('returns null when series not found', async () => {
    // Act
    const found = await repository.findById('nonexistent-id')

    // Assert
    expect(found).toBeNull()
  })

  test('listActive returns series with endDate >= today', async () => {
    // Arrange
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const futureDate = new Date(today)
    futureDate.setMonth(futureDate.getMonth() + 6) // 6 months from now

    const activeSeries = BookingSeries.create({
      spaceId: 'space-1',
      bookerName: 'Alice',
      frequency: RecurrenceFrequency.create('daily'),
      startTime: '10:00',
      endTime: '11:00',
      firstDate: today,
      endDate: futureDate,
      clock
    })

    const pastSeries = BookingSeries.create({
      spaceId: 'space-1',
      bookerName: 'Bob',
      frequency: RecurrenceFrequency.create('weekly'),
      startTime: '10:00',
      endTime: '11:00',
      firstDate: new Date('2020-05-01T00:00:00Z'),
      endDate: new Date('2020-06-04T23:59:59Z'), // Past
      clock
    })

    await repository.save(activeSeries)
    await repository.save(pastSeries)

    // Act
    const active = await repository.listActive()

    // Assert
    expect(active).toHaveLength(1)
    expect(active[0]?.toDto().id).toBe(activeSeries.toDto().id)
  })

  test('listActive includes series with endDate equal to today', async () => {
    // Arrange
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const series = BookingSeries.create({
      spaceId: 'space-1',
      bookerName: 'Alice',
      frequency: RecurrenceFrequency.create('daily'),
      startTime: '10:00',
      endTime: '11:00',
      firstDate: new Date('2026-06-01T00:00:00Z'),
      endDate: today,
      clock
    })

    await repository.save(series)

    // Act
    const active = await repository.listActive()

    // Assert
    expect(active).toHaveLength(1)
    expect(active[0]?.toDto().id).toBe(series.toDto().id)
  })
})
