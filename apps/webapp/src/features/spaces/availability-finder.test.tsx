import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

// TODO: Renders preset chips (Hoy, Mañana, Otra fecha)
// TODO: "Hoy" chip shows time picker with default = next round hour
// TODO: "Mañana" chip shows time picker with default = first open hour tomorrow
// TODO: "Otra fecha" chip shows date picker, then time picker
// TODO: "Hoy" chip after close time falls back to tomorrow with hint message
// TODO: "Buscar disponibilidad" button triggers tRPC query
// TODO: Results appear below time picker after query
// TODO: "Reservar" button opens quick-book sheet with pre-filled data
// TODO: "Ver día" button navigates to /spaces/:slug?date=
// TODO: Loading state during query
// TODO: Error state on query failure with retry

const mockAvailabilityQuery = mock(() => ({
  data: undefined,
  isLoading: false,
  error: null,
  refetch: mock(() => {})
}))

const mockNavigate = mock(() => {})

mock.module('@/trpc/react', () => ({
  api: {
    spaces: {
      availability: { useQuery: mockAvailabilityQuery }
    },
    useUtils: mock(() => ({}))
  }
}))

mock.module('@tanstack/react-router', () => ({
  createFileRoute: () => ({ component: (c: unknown) => c }),
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

import type { SpaceAvailabilityDto } from '@dfs/spaces/domain/space-availability.vo'
import { AvailabilityFinder } from './availability-finder'

describe('The AvailabilityFinder component', () => {
  afterEach(cleanup)

  test('renders preset chips', () => {
    render(<AvailabilityFinder />)

    expect(screen.getByRole('button', { name: /today/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /tomorrow/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /other date/i })).toBeDefined()
  })

  test('Hoy chip shows time picker with default next round hour', () => {
    // Fix time to 14:37 — next round hour should be 15:00
    const fixedNow = new Date('2026-05-10T17:37:00.000Z') // 14:37 Buenos Aires
    mock.module('bun:test', () => ({})) // no-op
    globalThis.Date.now = () => fixedNow.getTime()

    render(<AvailabilityFinder now={fixedNow} />)

    fireEvent.click(screen.getByRole('button', { name: /today/i }))

    const startInput = screen.getByLabelText('From') as HTMLInputElement
    expect(startInput.value).toBe('15:00')
  })

  test('Mañana chip shows time picker', () => {
    render(<AvailabilityFinder />)

    fireEvent.click(screen.getByRole('button', { name: /tomorrow/i }))

    expect(screen.getByLabelText('From')).toBeDefined()
  })

  test('Otra fecha chip shows date picker', () => {
    render(<AvailabilityFinder />)

    fireEvent.click(screen.getByRole('button', { name: /other date/i }))

    expect(screen.getByLabelText(/date/i)).toBeDefined()
  })

  test('Hoy chip after close time falls back to tomorrow with hint', () => {
    // Fix time to 23:30 — past close time heuristic (next round hour > 23:00)
    const lateNight = new Date('2026-05-11T02:30:00.000Z') // 23:30 Buenos Aires

    render(<AvailabilityFinder now={lateNight} />)

    fireEvent.click(screen.getByRole('button', { name: /today/i }))

    expect(screen.getByTestId('today-closed-hint')).toBeDefined()
  })

  test('Results appear after searching', () => {
    const freeSpace: SpaceAvailabilityDto = {
      spaceSlug: 'sala',
      spaceName: 'Sala',
      status: 'available',
      state: 'free',
      color: null
    }

    mockAvailabilityQuery.mockReturnValue({
      data: [freeSpace],
      isLoading: false,
      error: null,
      refetch: mock(() => {})
    })

    // Use a fixed now far in the future so past-check won't trigger
    const futureNow = new Date('2099-06-01T10:37:00.000Z')
    render(<AvailabilityFinder now={futureNow} />)
    fireEvent.click(screen.getByRole('button', { name: /today/i }))
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByText('Sala')).toBeDefined()
  })

  test('Loading state during query', () => {
    mockAvailabilityQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mock(() => {})
    })

    const futureNow = new Date('2099-06-01T10:37:00.000Z')
    render(<AvailabilityFinder now={futureNow} />)
    fireEvent.click(screen.getByRole('button', { name: /today/i }))
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getAllByTestId('result-skeleton').length).toBe(3)
  })

  test('Error state on query failure', () => {
    mockAvailabilityQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mock(() => {})
    })

    const futureNow = new Date('2099-06-01T10:37:00.000Z')
    render(<AvailabilityFinder now={futureNow} />)
    fireEvent.click(screen.getByRole('button', { name: /today/i }))
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByTestId('error-state')).toBeDefined()
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined()
  })

  test('Ver día button navigates to detail page', () => {
    const occupiedSpace: SpaceAvailabilityDto = {
      spaceSlug: 'cocina',
      spaceName: 'Cocina',
      status: 'occupied',
      state: 'occupied',
      occupiedBy: 'Marta',
      color: null
    }

    mockAvailabilityQuery.mockReturnValue({
      data: [occupiedSpace],
      isLoading: false,
      error: null,
      refetch: mock(() => {})
    })

    const futureNow = new Date('2099-06-01T10:37:00.000Z')
    render(<AvailabilityFinder now={futureNow} />)
    fireEvent.click(screen.getByRole('button', { name: /today/i }))
    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    fireEvent.click(screen.getByRole('button', { name: /view day/i }))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/spaces/$slug', params: { slug: 'cocina' } })
    )
  })
})
