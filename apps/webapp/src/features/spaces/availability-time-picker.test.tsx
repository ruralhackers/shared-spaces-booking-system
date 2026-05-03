import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AvailabilityTimePicker } from './availability-time-picker'

// TODO: Renders start and end time inputs
// TODO: Displays computed duration (hours and minutes)
// TODO: Validates end > start on submit
// TODO: Validates minimum 30min duration on submit
// TODO: Calls onSubmit with valid times
// TODO: Shows error message when validation fails

describe('The AvailabilityTimePicker component', () => {
  afterEach(cleanup)

  test('renders start and end time inputs', () => {
    render(
      <AvailabilityTimePicker
        defaultStart="14:00"
        defaultEnd="15:00"
        date="2099-12-31"
        onSubmit={() => {}}
      />
    )

    expect(screen.getByLabelText('From')).toBeDefined()
    expect(screen.getByLabelText('Until')).toBeDefined()
  })

  test('displays computed duration', () => {
    render(
      <AvailabilityTimePicker
        defaultStart="14:00"
        defaultEnd="15:30"
        date="2099-12-31"
        onSubmit={() => {}}
      />
    )

    const duration = screen.getByTestId('duration-label')
    expect(duration.textContent).toContain('1')
    expect(duration.textContent).toContain('30')
  })

  test('validates end > start on submit', () => {
    render(
      <AvailabilityTimePicker
        defaultStart="15:00"
        defaultEnd="14:00"
        date="2099-12-31"
        onSubmit={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByTestId('validation-error').textContent).toContain('after')
  })

  test('validates minimum 30min duration on submit', () => {
    render(
      <AvailabilityTimePicker
        defaultStart="14:00"
        defaultEnd="14:15"
        date="2099-12-31"
        onSubmit={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByTestId('validation-error').textContent).toContain('30')
  })

  test('calls onSubmit with valid times', () => {
    const onSubmit = mock(() => {})

    render(
      <AvailabilityTimePicker
        defaultStart="14:00"
        defaultEnd="15:00"
        date="2099-12-31"
        onSubmit={onSubmit}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(onSubmit).toHaveBeenCalledWith('14:00', '15:00')
  })

  test('shows error message when validation fails', () => {
    render(
      <AvailabilityTimePicker
        defaultStart="14:00"
        defaultEnd="14:00"
        date="2099-12-31"
        onSubmit={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /search/i }))

    expect(screen.getByTestId('validation-error')).toBeDefined()
  })
})
