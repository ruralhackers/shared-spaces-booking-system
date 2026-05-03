import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RecurringConfirmationDialog } from './recurring-confirmation-dialog'

describe('The RecurringConfirmationDialog', () => {
  afterEach(cleanup)

  test('displays created and skipped counts', () => {
    const result = {
      seriesId: 'series-1',
      created: [
        {
          id: '1',
          bookerName: 'Ana',
          startsAt: '2026-06-01T10:00:00Z',
          endsAt: '2026-06-01T11:00:00Z',
          status: 'active' as const,
          spaceSlug: 'room-a',
          spaceDisplayName: 'Room A',
          seriesId: 'series-1',
          createdAt: '2026-06-01T09:00:00Z'
        },
        {
          id: '2',
          bookerName: 'Ana',
          startsAt: '2026-06-02T10:00:00Z',
          endsAt: '2026-06-02T11:00:00Z',
          status: 'active' as const,
          spaceSlug: 'room-a',
          spaceDisplayName: 'Room A',
          seriesId: 'series-1',
          createdAt: '2026-06-01T09:00:00Z'
        }
      ],
      skipped: [{ date: '2026-06-03', reason: 'Overlaps with existing booking' }]
    }

    render(<RecurringConfirmationDialog open={true} onClose={() => {}} result={result} />)

    expect(screen.getByText(/2 bookings created/i)).toBeDefined()
    expect(screen.getByText(/1 skipped/i)).toBeDefined()
  })

  test('displays skipped dates with reasons', () => {
    const result = {
      seriesId: 'series-1',
      created: [],
      skipped: [
        { date: '2026-06-03', reason: 'Overlaps with existing booking' },
        { date: '2026-06-04', reason: 'Outside open hours' }
      ]
    }

    render(<RecurringConfirmationDialog open={true} onClose={() => {}} result={result} />)

    expect(screen.getByText('2026-06-03')).toBeDefined()
    expect(screen.getByText(/Overlaps with existing booking/i)).toBeDefined()
    expect(screen.getByText('2026-06-04')).toBeDefined()
    expect(screen.getByText(/Outside open hours/i)).toBeDefined()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = mock(() => {})
    const result = {
      seriesId: 'series-1',
      created: [],
      skipped: []
    }

    render(<RecurringConfirmationDialog open={true} onClose={onClose} result={result} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })
})
