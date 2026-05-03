import { describe, expect, test } from 'bun:test'
import { type Clock, ValidationError } from '@dfs/common'
import { BookingSeries } from './booking-series.entity'
import { RecurrenceFrequency } from './recurrence-frequency.vo'

const fixedClock: Clock = { now: () => new Date('2026-06-01T10:00:00Z') }

describe('The BookingSeries', () => {
  describe('create', () => {
    test('accepts daily series with valid parameters', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        clock: fixedClock
      }

      // Act
      const series = BookingSeries.create(params)

      // Assert
      const dto = series.toDto()
      expect(dto.frequency).toBe('daily')
      expect(dto.startTime).toBe('10:00')
      expect(dto.endTime).toBe('11:00')
      expect(dto.firstDate).toBe('2026-06-01T00:00:00.000Z')
      expect(dto.endDate).toBe('2026-06-05T00:00:00.000Z')
    })

    test('accepts weekly series with valid parameters', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('weekly'),
        startTime: '17:00',
        endTime: '18:00',
        firstDate: new Date('2026-06-02'), // Tuesday
        endDate: new Date('2026-06-23'),
        clock: fixedClock
      }

      // Act
      const series = BookingSeries.create(params)

      // Assert
      const dto = series.toDto()
      expect(dto.frequency).toBe('weekly')
    })

    test('rejects series exceeding 365 occurrence limit', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2027-06-01'), // 366 days
        clock: fixedClock
      }

      // Act & Assert
      expect(() => BookingSeries.create(params)).toThrow(ValidationError)
    })

    test('accepts series at exactly 365 occurrence limit', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'), // 364 days
        clock: fixedClock
      }

      // Act
      const series = BookingSeries.create(params)

      // Assert
      expect(series.toDto().endDate).toBe('2027-05-31T00:00:00.000Z')
    })

    test('generates unique ID for each series', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        clock: fixedClock
      }

      // Act
      const series1 = BookingSeries.create(params)
      const series2 = BookingSeries.create(params)

      // Assert
      expect(series1.toDto().id).not.toBe(series2.toDto().id)
    })

    test('captures creation timestamp from clock', () => {
      // Arrange
      const params = {
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        clock: fixedClock
      }

      // Act
      const series = BookingSeries.create(params)

      // Assert
      expect(series.toDto().createdAt).toBe('2026-06-01T10:00:00.000Z')
    })
  })

  describe('expandOccurrences', () => {
    test('generates all daily occurrences within date range', () => {
      // Arrange
      const series = BookingSeries.create({
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        clock: fixedClock
      })

      // Act
      const occurrences = series.expandOccurrences('America/Argentina/Buenos_Aires')

      // Assert
      expect(occurrences).toHaveLength(5)
      expect(occurrences[0].getStart().toISOString()).toBe('2026-06-01T13:00:00.000Z') // 10:00 ART
      expect(occurrences[0].getEnd().toISOString()).toBe('2026-06-01T14:00:00.000Z') // 11:00 ART
      expect(occurrences[4].getStart().toISOString()).toBe('2026-06-05T13:00:00.000Z')
    })

    test('generates all weekly occurrences within date range', () => {
      // Arrange
      const series = BookingSeries.create({
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('weekly'),
        startTime: '17:00',
        endTime: '18:00',
        firstDate: new Date('2026-06-02'), // Tuesday
        endDate: new Date('2026-06-23'),
        clock: fixedClock
      })

      // Act
      const occurrences = series.expandOccurrences('America/Argentina/Buenos_Aires')

      // Assert
      expect(occurrences).toHaveLength(4) // 4 Tuesdays
      expect(occurrences[0].getStart().toISOString()).toBe('2026-06-02T20:00:00.000Z') // 17:00 ART
      expect(occurrences[1].getStart().toISOString()).toBe('2026-06-09T20:00:00.000Z')
      expect(occurrences[2].getStart().toISOString()).toBe('2026-06-16T20:00:00.000Z')
      expect(occurrences[3].getStart().toISOString()).toBe('2026-06-23T20:00:00.000Z')
    })
  })

  describe('fromDto / toDto', () => {
    test('preserves all data through serialization round-trip', () => {
      // Arrange
      const series = BookingSeries.create({
        spaceId: 'space-1',
        bookerName: 'Ana',
        frequency: RecurrenceFrequency.create('daily'),
        startTime: '10:00',
        endTime: '11:00',
        firstDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        clock: fixedClock
      })

      // Act
      const dto = series.toDto()
      const restored = BookingSeries.fromDto(dto)
      const restoredDto = restored.toDto()

      // Assert
      expect(restoredDto).toEqual(dto)
    })
  })
})
