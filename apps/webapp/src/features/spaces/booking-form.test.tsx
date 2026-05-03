import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BookingForm } from './booking-form'

describe('The BookingForm', () => {
  afterEach(cleanup)

  test('displays name, start time, end time inputs and Book button', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} />)

    expect(screen.getByLabelText('Name')).toBeDefined()
    expect(screen.getByLabelText('Start time')).toBeDefined()
    expect(screen.getByLabelText('End time')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Book' })).toBeDefined()
  })

  test('pre-fills start and end time inputs on render', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} />)

    const startInput = screen.getByLabelText('Start time') as HTMLInputElement
    const endInput = screen.getByLabelText('End time') as HTMLInputElement

    expect(startInput.value).toMatch(/^\d{2}:00$/)
    expect(endInput.value).toMatch(/^\d{2}:00$/)
  })

  test('disables the submit button while pending', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} isPending />)

    const button = screen.getByRole('button', { name: /booking/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  test('calls onSubmit with bookerName and times converted to UTC ISO instants in the booking timezone', () => {
    const onSubmit = mock(() => {})
    render(<BookingForm date="2026-06-01" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '11:00' } })
    const form = screen.getByRole('button', { name: 'Book' }).closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)

    // America/Argentina/Buenos_Aires is UTC-3 year-round
    expect(onSubmit).toHaveBeenCalledWith({
      type: 'single',
      bookerName: 'Ana',
      startsAt: '2026-06-01T13:00:00.000Z',
      endsAt: '2026-06-01T14:00:00.000Z'
    })
  })

  test('displays repeat booking toggle', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} />)

    expect(screen.getByLabelText('Repeat booking')).toBeDefined()
  })

  test('shows frequency selector when repeat toggle is enabled', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} />)

    const toggle = screen.getByLabelText('Repeat booking') as HTMLInputElement
    fireEvent.click(toggle)

    expect(screen.getByLabelText('Frequency')).toBeDefined()
  })

  test('shows end type selector when repeat toggle is enabled', () => {
    render(<BookingForm date="2026-06-01" onSubmit={() => {}} />)

    const toggle = screen.getByLabelText('Repeat booking') as HTMLInputElement
    fireEvent.click(toggle)

    // Check radio buttons are present
    const dateRadio = screen.getByRole('radio', { name: 'Until date' }) as HTMLInputElement
    const countRadio = screen.getByRole('radio', {
      name: 'Number of occurrences'
    }) as HTMLInputElement

    expect(dateRadio).toBeDefined()
    expect(countRadio).toBeDefined()
    expect(dateRadio.checked).toBe(true) // date is default
  })

  test('calls onSubmit with single booking data when repeat is disabled', () => {
    const onSubmit = mock(() => {})
    render(<BookingForm date="2026-06-01" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '11:00' } })

    const form = screen.getByRole('button', { name: 'Book' }).closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'single',
      bookerName: 'Ana',
      startsAt: '2026-06-01T13:00:00.000Z',
      endsAt: '2026-06-01T14:00:00.000Z'
    })
  })

  test('calls onSubmit with recurring booking data when repeat is enabled', () => {
    const onSubmit = mock(() => {})
    render(<BookingForm date="2026-06-01" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '11:00' } })

    // Enable repeat
    const toggle = screen.getByLabelText('Repeat booking') as HTMLInputElement
    fireEvent.click(toggle)

    // Set frequency to weekly
    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'weekly' } })

    // Select count end type
    const countRadio = screen.getByRole('radio', { name: 'Number of occurrences' })
    fireEvent.click(countRadio)

    // Set count to 5 - use type="number" to find the input specifically
    const countInput = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(countInput, { target: { value: '5' } })

    const form = screen.getByRole('button', { name: 'Book' }).closest('form')
    if (!form) throw new Error('Form not found')
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'recurring',
      bookerName: 'Ana',
      startsAt: '2026-06-01T13:00:00.000Z',
      endsAt: '2026-06-01T14:00:00.000Z',
      frequency: 'weekly',
      end: { type: 'count', value: 5 }
    })
  })
})
