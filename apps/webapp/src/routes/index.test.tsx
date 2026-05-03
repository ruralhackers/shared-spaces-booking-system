import { afterEach, describe, expect, mock, test } from 'bun:test'
import type { SpaceDto } from '@dfs/spaces/application/dtos'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// Mock tRPC
const mockUseQuery = mock(() => ({ data: undefined, isLoading: false, error: null }))
const mockUseMutation = mock(() => ({ mutate: mock(() => {}), isPending: false }))
const mockUseUtils = mock(() => ({
  spaces: { list: { invalidate: mock(() => {}) } }
}))

mock.module('@/trpc/react', () => ({
  api: {
    spaces: {
      list: { useQuery: mockUseQuery },
      book: { useMutation: mockUseMutation }
    },
    useUtils: mockUseUtils
  }
}))

function makeSpace(overrides: Partial<SpaceDto> = {}): SpaceDto {
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
      freeWindowMinutes: 480
    },
    ...overrides
  }
}

// Also mock router for navigation
mock.module('@tanstack/react-router', () => ({
  createFileRoute: () => ({ component: (c: unknown) => c }),
  useNavigate: () => mock(() => {}),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

import { HomePage } from './index'

describe('The HomePage', () => {
  afterEach(cleanup)

  // Task 9.1 RED: renders 3 space cards
  test('renders a SpaceCard for each space', () => {
    mockUseQuery.mockReturnValue({
      data: [
        makeSpace(),
        makeSpace({ id: 'id2', slug: 'call-room', displayName: 'Call Room' }),
        makeSpace({ id: 'id3', slug: 'focus', displayName: 'Focus Room' })
      ],
      isLoading: false,
      error: null
    })

    render(<HomePage />)

    expect(screen.getByText('Chill House')).toBeDefined()
    expect(screen.getByText('Call Room')).toBeDefined()
    expect(screen.getByText('Focus Room')).toBeDefined()
  })

  // Task 9.4 RED: clicking quick button opens sheet
  test('opens QuickBookSheet when quick button clicked', () => {
    mockUseQuery.mockReturnValue({
      data: [makeSpace()],
      isLoading: false,
      error: null
    })

    render(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: '1h' }))

    expect(screen.getByRole('heading', { name: 'Confirm booking' })).toBeDefined()
  })

  // Task 9.10 RED: shows skeleton when loading
  test('renders loading skeleton when isLoading is true', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<HomePage />)

    const skeletons = document.querySelectorAll('[data-testid="space-card-skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  // Task 9.13 RED: empty state
  test('renders empty state when no spaces exist', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })

    render(<HomePage />)

    expect(screen.getByText(/no spaces yet/i)).toBeDefined()
  })
})
