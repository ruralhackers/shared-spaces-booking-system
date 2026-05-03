import { afterEach, describe, expect, mock, test } from 'bun:test'
import type { SpaceAvailabilityDto } from '@dfs/spaces/domain/space-availability.vo'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AvailabilityResultsList } from './availability-results-list'

// TODO: Renders available space (state: 'free') with "Reservar" button
// TODO: Renders occupied space (state: 'occupied') with occupant name and "Ver día" button
// TODO: Renders closed space (state: 'closed') with "Cerrado" label
// TODO: Renders empty state when all spaces unavailable
// TODO: Renders loading state (skeleton rows)
// TODO: Renders error state with retry button
// TODO: Calls onReserve with correct space slug when "Reservar" clicked
// TODO: Calls onViewDay with correct space slug and date when "Ver día" clicked

const FREE_SPACE: SpaceAvailabilityDto = {
  spaceSlug: 'sala-reuniones',
  spaceName: 'Sala Reuniones',
  status: 'available',
  state: 'free',
  color: '#3b82f6'
}

const OCCUPIED_SPACE: SpaceAvailabilityDto = {
  spaceSlug: 'cocina',
  spaceName: 'Cocina',
  status: 'occupied',
  state: 'occupied',
  occupiedBy: 'Marta',
  color: '#10b981'
}

const CLOSED_SPACE: SpaceAvailabilityDto = {
  spaceSlug: 'chill-house',
  spaceName: 'Chill House',
  status: 'occupied',
  state: 'closed',
  color: null
}

const BASE_PROPS = {
  isLoading: false,
  error: null,
  onRetry: () => {},
  onReserve: () => {},
  onViewDay: () => {},
  chosenDate: '2026-05-10',
  chosenStart: '14:00',
  chosenEnd: '15:00'
}

describe('The AvailabilityResultsList component', () => {
  afterEach(cleanup)

  test('renders available space with Reservar button', () => {
    render(<AvailabilityResultsList {...BASE_PROPS} results={[FREE_SPACE]} />)

    expect(screen.getByText('Sala Reuniones')).toBeDefined()
    expect(screen.getByRole('button', { name: /reserve/i })).toBeDefined()
  })

  test('renders occupied space with occupant name and Ver día button', () => {
    render(<AvailabilityResultsList {...BASE_PROPS} results={[OCCUPIED_SPACE]} />)

    expect(screen.getByText('Cocina')).toBeDefined()
    expect(screen.getByText(/Marta/)).toBeDefined()
    expect(screen.getByRole('button', { name: /view day/i })).toBeDefined()
  })

  test('renders closed space with Closed label and no action button', () => {
    render(<AvailabilityResultsList {...BASE_PROPS} results={[CLOSED_SPACE]} />)

    expect(screen.getByText('Chill House')).toBeDefined()
    expect(screen.getByTestId('closed-label')).toBeDefined()
    expect(screen.queryByRole('button', { name: /reserve/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /view day/i })).toBeNull()
  })

  test('renders empty state when all spaces unavailable', () => {
    render(<AvailabilityResultsList {...BASE_PROPS} results={[OCCUPIED_SPACE, CLOSED_SPACE]} />)

    expect(screen.getByTestId('empty-state')).toBeDefined()
  })

  test('renders loading state with skeleton rows', () => {
    render(<AvailabilityResultsList {...BASE_PROPS} results={[]} isLoading={true} />)

    const skeletons = screen.getAllByTestId('result-skeleton')
    expect(skeletons.length).toBe(3)
  })

  test('renders error state with retry button', () => {
    render(
      <AvailabilityResultsList {...BASE_PROPS} results={[]} error={new Error('Network error')} />
    )

    expect(screen.getByTestId('error-state')).toBeDefined()
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined()
  })

  test('calls onReserve with correct space data when Reservar clicked', () => {
    const onReserve = mock((_: { id: string; slug: string; name: string }) => {})

    render(<AvailabilityResultsList {...BASE_PROPS} results={[FREE_SPACE]} onReserve={onReserve} />)

    fireEvent.click(screen.getByRole('button', { name: /reserve/i }))

    expect(onReserve).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'sala-reuniones', name: 'Sala Reuniones' })
    )
  })

  test('calls onViewDay with correct space slug and date when Ver día clicked', () => {
    const onViewDay = mock((_slug: string, _date: string) => {})

    render(
      <AvailabilityResultsList
        {...BASE_PROPS}
        results={[OCCUPIED_SPACE]}
        onViewDay={onViewDay}
        chosenDate="2026-05-10"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /view day/i }))

    expect(onViewDay).toHaveBeenCalledWith('cocina', '2026-05-10')
  })
})
