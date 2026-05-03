import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SpaceDto } from '@dfs/spaces/application/dtos'
import { SpaceCard } from './space-card'

function makeSpace(overrides: Partial<SpaceDto['currentStatus']> = {}): SpaceDto {
  return {
    id: 'clh1234567890abcdefghijk',
    slug: 'chill-house',
    displayName: 'Chill House',
    description: 'A lounge',
    color: '#3b82f6',
    openHours: {
      mon: [{ start: '09:00', end: '18:00' }],
      tue: [{ start: '09:00', end: '18:00' }],
      wed: [{ start: '09:00', end: '18:00' }],
      thu: [{ start: '09:00', end: '18:00' }],
      fri: [{ start: '09:00', end: '18:00' }],
      sat: [{ start: '09:00', end: '18:00' }],
      sun: [{ start: '09:00', end: '18:00' }]
    },
    isOccupiedNow: false,
    currentStatus: {
      state: 'free',
      freeUntil: '2026-05-03T21:00:00.000Z',
      freeWindowMinutes: 480,
      ...overrides
    }
  }
}

describe('The SpaceCard component', () => {
  afterEach(cleanup)

  // Task 7.1 RED: renders free status with quick buttons
  test('renders quick buttons [30min] [1h] [2h] when free with 120+ minutes', () => {
    const space = makeSpace({ state: 'free', freeWindowMinutes: 120 })
    render(<SpaceCard space={space} onQuickBook={() => {}} onNavigate={() => {}} />)

    expect(screen.getByRole('button', { name: '30min' })).toBeDefined()
    expect(screen.getByRole('button', { name: '1h' })).toBeDefined()
    expect(screen.getByRole('button', { name: '2h' })).toBeDefined()
  })

  // Task 7.4 RED: hides [1h] when only 30min free
  test('hides [1h] and [2h] buttons when only 30 minutes free', () => {
    const space = makeSpace({ state: 'free', freeWindowMinutes: 30 })
    render(<SpaceCard space={space} onQuickBook={() => {}} onNavigate={() => {}} />)

    expect(screen.getByRole('button', { name: '30min' })).toBeDefined()
    expect(screen.queryByRole('button', { name: '1h' })).toBeNull()
    expect(screen.queryByRole('button', { name: '2h' })).toBeNull()
  })

  // Task 7.7 RED: renders occupied status
  test('renders "Book later" button and no quick buttons when occupied', () => {
    const space = makeSpace({
      state: 'occupied',
      occupiedBy: 'Alice',
      occupiedUntil: '2026-05-03T18:00:00.000Z'
    })
    space.isOccupiedNow = true
    render(<SpaceCard space={space} onQuickBook={() => {}} onNavigate={() => {}} />)

    expect(screen.getByRole('button', { name: /book later/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: '30min' })).toBeNull()
    expect(screen.queryByRole('button', { name: '1h' })).toBeNull()
  })

  // Task 7.10 RED: renders closed status
  test('renders closed status line showing next open time', () => {
    const space = makeSpace({
      state: 'closed',
      nextOpenAt: '2026-05-03T17:00:00.000Z'
    })
    render(<SpaceCard space={space} onQuickBook={() => {}} onNavigate={() => {}} />)

    // 14:00 Buenos Aires
    expect(screen.getByText(/Closed · opens 14:00/i)).toBeDefined()
    expect(screen.queryByRole('button', { name: '30min' })).toBeNull()
  })

  test('calls onQuickBook with correct duration when quick button clicked', () => {
    const onQuickBook = mock(() => {})
    const space = makeSpace({ state: 'free', freeWindowMinutes: 120 })
    render(<SpaceCard space={space} onQuickBook={onQuickBook} onNavigate={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: '1h' }))

    expect(onQuickBook).toHaveBeenCalledWith(60)
  })

  test('calls onNavigate when card body is clicked', () => {
    const onNavigate = mock(() => {})
    const space = makeSpace({ state: 'free', freeWindowMinutes: 120 })
    render(<SpaceCard space={space} onQuickBook={() => {}} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByText('Chill House'))

    expect(onNavigate).toHaveBeenCalled()
  })
})
