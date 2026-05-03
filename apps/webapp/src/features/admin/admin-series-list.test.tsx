import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AdminSeriesList } from './admin-series-list'

describe('The AdminSeriesList', () => {
  afterEach(cleanup)

  test('displays message when no series exist', () => {
    render(<AdminSeriesList series={[]} onCancel={() => {}} isPending={false} />)

    expect(screen.getByText(/no active/i)).toBeDefined()
  })

  test('renders table with series data', () => {
    const series = [
      {
        id: 'series-1',
        bookerName: 'Ana',
        spaceSlug: 'meeting-room',
        frequency: 'daily',
        startTime: '10:00',
        endTime: '11:00',
        firstDate: '2026-05-03T00:00:00Z',
        endDate: '2026-05-10T00:00:00Z'
      }
    ]

    render(<AdminSeriesList series={series} onCancel={() => {}} isPending={false} />)

    expect(screen.getByText('Ana')).toBeDefined()
    expect(screen.getByText('meeting-room')).toBeDefined()
    expect(screen.getByText('daily')).toBeDefined()
  })

  test('calls onCancel when cancel button is clicked', () => {
    const onCancel = mock(() => {})
    const series = [
      {
        id: 'series-1',
        bookerName: 'Ana',
        spaceSlug: 'meeting-room',
        frequency: 'daily',
        startTime: '10:00',
        endTime: '11:00',
        firstDate: '2026-05-03T00:00:00Z',
        endDate: '2026-05-10T00:00:00Z'
      }
    ]

    render(<AdminSeriesList series={series} onCancel={onCancel} isPending={false} />)

    const cancelButton = screen.getByRole('button', { name: /cancel series/i })
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledWith('series-1')
  })

  test('disables cancel buttons when operation is pending', () => {
    const series = [
      {
        id: 'series-1',
        bookerName: 'Ana',
        spaceSlug: 'meeting-room',
        frequency: 'daily',
        startTime: '10:00',
        endTime: '11:00',
        firstDate: '2026-05-03T00:00:00Z',
        endDate: '2026-05-10T00:00:00Z'
      }
    ]

    render(<AdminSeriesList series={series} onCancel={() => {}} isPending />)

    const cancelButton = screen.getByRole('button', { name: /cancel series/i })
    expect((cancelButton as HTMLButtonElement).disabled).toBe(true)
  })
})
