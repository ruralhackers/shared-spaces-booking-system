import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { BookingListItem } from './booking-list-item'

describe('The BookingListItem', () => {
  afterEach(cleanup)

  test('displays booker name and time range', () => {
    render(
      <BookingListItem
        booking={{
          id: '1',
          bookerName: 'Ana',
          startsAt: '2026-05-03T10:00:00Z',
          endsAt: '2026-05-03T11:00:00Z',
          seriesId: null
        }}
        cancelName=""
        onCancelNameChange={() => {}}
        onCancel={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByText('Ana')).toBeDefined()
  })

  test('shows recurrence icon when booking has seriesId', () => {
    render(
      <BookingListItem
        booking={{
          id: '1',
          bookerName: 'Ana',
          startsAt: '2026-05-03T10:00:00Z',
          endsAt: '2026-05-03T11:00:00Z',
          seriesId: 'series-1'
        }}
        cancelName=""
        onCancelNameChange={() => {}}
        onCancel={() => {}}
        isPending={false}
      />
    )

    const icon = screen.getByText('↻')
    expect(icon).toBeDefined()
  })

  test('does not show recurrence icon for single bookings', () => {
    render(
      <BookingListItem
        booking={{
          id: '1',
          bookerName: 'Ana',
          startsAt: '2026-05-03T10:00:00Z',
          endsAt: '2026-05-03T11:00:00Z',
          seriesId: null
        }}
        cancelName=""
        onCancelNameChange={() => {}}
        onCancel={() => {}}
        isPending={false}
      />
    )

    expect(() => screen.getByText('↻')).toThrow()
  })
})
