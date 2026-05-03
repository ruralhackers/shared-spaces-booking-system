import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { FixedClock, TimeRange } from '@dfs/common'
import { createTestPrisma, type TestPrisma } from '@dfs/database/testing'
import { BookerName } from '../domain/booker-name.vo'
import { Booking } from '../domain/booking.entity'
import { BookingPrismaRepository } from './booking-prisma.repository'
import { SpacePrismaRepository } from './space-prisma.repository'

const TZ = 'America/Argentina/Buenos_Aires'
const clock = new FixedClock(new Date('2026-05-04T12:00:00-03:00'))

let db: TestPrisma

beforeAll(async () => {
  db = await createTestPrisma()
  // Seed a space for FK
  await db.client.space.create({
    data: {
      id: 'clh1234567890abcdefghijk',
      slug: 'chill-house',
      displayName: 'Chill House',
      description: 'Lounge',
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

afterAll(async () => {
  await db.close()
})

describe('The BookingPrismaRepository', () => {
  test('persists and retrieves booking by ID', async () => {
    const spaceRepo = new SpacePrismaRepository(db.client)
    const bookingRepo = new BookingPrismaRepository(db.client)
    const space = await spaceRepo.findBySlug('chill-house')
    if (!space) throw new Error('Space not found')
    const booking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-04T10:00:00-03:00'),
        end: new Date('2026-05-04T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Ana'),
      existing: [],
      clock,
      tz: TZ
    })

    await bookingRepo.save(booking)

    const found = await bookingRepo.findById(booking.toDto().id)
    expect(found).not.toBeNull()
    expect(found?.toDto().bookerName).toBe('Ana')
  })

  test('lists only active bookings for requested day', async () => {
    const spaceRepo = new SpacePrismaRepository(db.client)
    const bookingRepo = new BookingPrismaRepository(db.client)
    const space = await spaceRepo.findBySlug('chill-house')
    if (!space) throw new Error('Space not found')
    const activeBooking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-04T12:00:00-03:00'),
        end: new Date('2026-05-04T13:00:00-03:00')
      }),
      bookerName: BookerName.create('Bob'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(activeBooking)
    const cancelledBooking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-04T14:00:00-03:00'),
        end: new Date('2026-05-04T15:00:00-03:00')
      }),
      bookerName: BookerName.create('Carol'),
      existing: [],
      clock,
      tz: TZ
    })
    cancelledBooking.cancelByAdmin(clock)
    await bookingRepo.save(cancelledBooking)

    const results = await bookingRepo.listActiveOnDay(
      space.toDto().id,
      new Date('2026-05-04T12:00:00Z'),
      TZ
    )

    const names = results.map((b) => b.toDto().bookerName)
    expect(names).toContain('Bob')
    expect(names).not.toContain('Carol')
  })

  test('lists all active bookings ordered by startsAt ascending', async () => {
    const bookingRepo = new BookingPrismaRepository(db.client)

    const all = await bookingRepo.listAllActive()

    const times = all.map((b) => new Date(b.toDto().startsAt).getTime())
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1] as number)
    }
  })

  test('finds overlapping bookings within time range', async () => {
    const spaceRepo = new SpacePrismaRepository(db.client)
    const bookingRepo = new BookingPrismaRepository(db.client)
    const space = await spaceRepo.findBySlug('chill-house')
    if (!space) throw new Error('Space not found')

    const booking1 = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-06T10:00:00-03:00'),
        end: new Date('2026-05-06T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Dave'),
      existing: [],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking1)

    const booking2 = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-06T14:00:00-03:00'),
        end: new Date('2026-05-06T15:00:00-03:00')
      }),
      bookerName: BookerName.create('Eve'),
      existing: [booking1],
      clock,
      tz: TZ
    })
    await bookingRepo.save(booking2)

    const overlapping = await bookingRepo.findOverlapping(
      space.toDto().id,
      new Date('2026-05-06T10:30:00-03:00'),
      new Date('2026-05-06T11:30:00-03:00')
    )

    expect(overlapping).toHaveLength(1)
    expect(overlapping[0]?.toDto().bookerName).toBe('Dave')
  })

  test('finds no overlapping bookings when time range is clear', async () => {
    const spaceRepo = new SpacePrismaRepository(db.client)
    const bookingRepo = new BookingPrismaRepository(db.client)
    const space = await spaceRepo.findBySlug('chill-house')
    if (!space) throw new Error('Space not found')

    const overlapping = await bookingRepo.findOverlapping(
      space.toDto().id,
      new Date('2026-05-06T12:00:00-03:00'),
      new Date('2026-05-06T13:00:00-03:00')
    )

    expect(overlapping).toHaveLength(0)
  })

  test('excludes cancelled bookings from overlapping results', async () => {
    const spaceRepo = new SpacePrismaRepository(db.client)
    const bookingRepo = new BookingPrismaRepository(db.client)
    const space = await spaceRepo.findBySlug('chill-house')
    if (!space) throw new Error('Space not found')

    const cancelledBooking = Booking.create({
      space,
      range: TimeRange.create({
        start: new Date('2026-05-07T10:00:00-03:00'),
        end: new Date('2026-05-07T11:00:00-03:00')
      }),
      bookerName: BookerName.create('Frank'),
      existing: [],
      clock,
      tz: TZ
    })
    cancelledBooking.cancelByAdmin(clock)
    await bookingRepo.save(cancelledBooking)

    const overlapping = await bookingRepo.findOverlapping(
      space.toDto().id,
      new Date('2026-05-07T10:30:00-03:00'),
      new Date('2026-05-07T11:30:00-03:00')
    )

    expect(overlapping).toHaveLength(0)
  })
})
