import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Stub NowIndicator to avoid Date.now() complexity in DayTimeline tests
mock.module('./now-indicator', () => ({
  NowIndicator: () => <div data-testid="now-indicator" />
}))

import { DayTimeline } from './day-timeline'

const OPEN_HOURS = [{ start: '09:00', end: '22:00' }]

const makeBooking = (
  id: string,
  bookerName: string,
  startsAt: string,
  endsAt: string,
  seriesId: string | null = null
) => ({
  id,
  bookerName,
  startsAt,
  endsAt,
  seriesId,
  spaceId: 'space-1',
  spaceSlug: 'chill-house',
  spaceDisplayName: 'Chill House',
  status: 'active' as const,
  createdAt: '2026-05-03T00:00:00Z',
  cancelledAt: null,
  cancelledBy: null
})

describe('The DayTimeline component', () => {
  afterEach(cleanup)

  // 2.1 RED: renders hour rows for open hours range
  test('renders hour labels for open hours range', () => {
    render(
      <DayTimeline
        bookings={[]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={() => {}}
        onBookingTap={() => {}}
      />
    )

    expect(screen.getByText('09')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('21')).toBeDefined()
    // 22 is the end boundary, should not be rendered as a row
    expect(() => screen.getByTestId('hour-row-22')).toThrow()
  })

  // 2.4 RED: positions booking block proportional to start/end minutes
  test('positions booking block proportional to start/end minutes', () => {
    // 10:30 to 11:15 BA time, timeline starts at 09:00
    // top = (10.5 - 9) * 56 = 84px, height = (45/60) * 56 = 42px
    const booking = makeBooking(
      'b1',
      'Marta',
      '2026-05-03T13:30:00Z', // 10:30 Buenos Aires
      '2026-05-03T14:15:00Z' // 11:15 Buenos Aires
    )

    render(
      <DayTimeline
        bookings={[booking]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={() => {}}
        onBookingTap={() => {}}
        spaceColor="#3b82f6"
      />
    )

    const block = screen.getByTestId('booking-block-b1')
    const style = (block as HTMLElement).style
    expect(style.top).toBe('84px')
    expect(style.height).toBe('42px')
  })

  // 2.7 RED: displays booker name in booking block
  test('displays booker name in booking block', () => {
    const booking = makeBooking(
      'b1',
      'Marta',
      '2026-05-03T13:00:00Z', // 10:00 BA
      '2026-05-03T14:00:00Z' // 11:00 BA
    )

    render(
      <DayTimeline
        bookings={[booking]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={() => {}}
        onBookingTap={() => {}}
      />
    )

    expect(screen.getByText('Marta')).toBeDefined()
  })

  // 2.10 RED: calls onSlotTap when free slot is clicked
  test('calls onSlotTap with hour when free slot is clicked', async () => {
    const onSlotTap = mock(() => {})

    render(
      <DayTimeline
        bookings={[]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={onSlotTap}
        onBookingTap={() => {}}
      />
    )

    const slot = screen.getByTestId('hour-row-10')
    await userEvent.click(slot)

    expect(onSlotTap).toHaveBeenCalledWith(10)
  })

  // 2.13 RED: calls onBookingTap when booking block is clicked
  test('calls onBookingTap with bookingId when booking block is clicked', async () => {
    const onBookingTap = mock(() => {})
    const booking = makeBooking('123', 'Marta', '2026-05-03T13:00:00Z', '2026-05-03T14:00:00Z')

    render(
      <DayTimeline
        bookings={[booking]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={() => {}}
        onBookingTap={onBookingTap}
      />
    )

    const block = screen.getByTestId('booking-block-123')
    await userEvent.click(block)

    expect(onBookingTap).toHaveBeenCalledWith('123', 'Marta')
  })

  // 2.16 RED: renders overlapping bookings side-by-side
  test('renders overlapping bookings side-by-side with 50% width', () => {
    const bookingA = makeBooking('b1', 'Marta', '2026-05-03T13:00:00Z', '2026-05-03T14:00:00Z') // 10:00–11:00 BA
    const bookingB = makeBooking('b2', 'Pablo', '2026-05-03T13:30:00Z', '2026-05-03T14:30:00Z') // 10:30–11:30 BA

    render(
      <DayTimeline
        bookings={[bookingA, bookingB]}
        openHours={OPEN_HOURS}
        date="2026-05-03"
        onSlotTap={() => {}}
        onBookingTap={() => {}}
      />
    )

    const blockA = screen.getByTestId('booking-block-b1') as HTMLElement
    const blockB = screen.getByTestId('booking-block-b2') as HTMLElement

    expect(blockA.style.width).toBe('50%')
    expect(blockB.style.width).toBe('50%')
  })

  // 4.3: NowIndicator is rendered when date is today
  test('renders NowIndicator when date is today', () => {
    const today = new Date().toISOString().slice(0, 10)

    render(
      <DayTimeline
        bookings={[]}
        openHours={OPEN_HOURS}
        date={today}
        onSlotTap={() => {}}
        onBookingTap={() => {}}
      />
    )

    expect(screen.getByTestId('now-indicator')).toBeDefined()
  })
})
