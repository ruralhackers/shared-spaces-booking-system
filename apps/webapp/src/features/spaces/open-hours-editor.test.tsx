import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OpenHours } from './open-hours-editor'
import { OpenHoursEditor } from './open-hours-editor'

const allClosed: OpenHours = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: []
}

const all24h: OpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

describe('The OpenHoursEditor', () => {
  afterEach(cleanup)

  test('renders 7 day sections', () => {
    render(<OpenHoursEditor value={allClosed} onChange={() => {}} />)

    expect(screen.getByText('Monday')).toBeDefined()
    expect(screen.getByText('Tuesday')).toBeDefined()
    expect(screen.getByText('Wednesday')).toBeDefined()
    expect(screen.getByText('Thursday')).toBeDefined()
    expect(screen.getByText('Friday')).toBeDefined()
    expect(screen.getByText('Saturday')).toBeDefined()
    expect(screen.getByText('Sunday')).toBeDefined()
  })

  test('shows "Add window" buttons for closed days', () => {
    render(<OpenHoursEditor value={allClosed} onChange={() => {}} />)

    const addButtons = screen.getAllByText('+ Add window')

    expect(addButtons.length).toBe(7)
  })

  test('calls onChange when adding a window', () => {
    let captured: OpenHours | null = null
    const onChange = (v: OpenHours) => {
      captured = v
    }
    render(<OpenHoursEditor value={allClosed} onChange={onChange} />)
    const addButtons = screen.getAllByText('+ Add window')
    if (addButtons.length === 0) throw new Error('No add buttons found')
    fireEvent.click(addButtons[0])

    expect(captured).not.toBeNull()
    expect(captured?.mon.length).toBe(1)
  })

  test('shows "Open 24h" checkboxes', () => {
    render(<OpenHoursEditor value={allClosed} onChange={() => {}} />)

    const checkboxes = screen.getAllByLabelText('Open 24h')

    expect(checkboxes.length).toBe(7)
  })

  test('toggling "Open 24h" sets window to 00:00–24:00', () => {
    let captured: OpenHours | null = null
    const onChange = (v: OpenHours) => {
      captured = v
    }
    render(<OpenHoursEditor value={allClosed} onChange={onChange} />)
    const checkboxes = screen.getAllByLabelText('Open 24h')
    if (checkboxes.length === 0) throw new Error('No checkboxes found')
    fireEvent.click(checkboxes[0])

    expect(captured).not.toBeNull()
    expect(captured?.mon).toEqual([{ start: '00:00', end: '24:00' }])
  })

  test('toggling "Open 24h" off clears all windows', () => {
    let captured: OpenHours | null = null
    const onChange = (v: OpenHours) => {
      captured = v
    }
    render(<OpenHoursEditor value={all24h} onChange={onChange} />)
    const checkboxes = screen.getAllByLabelText('Open 24h')
    if (checkboxes.length === 0) throw new Error('No checkboxes found')
    fireEvent.click(checkboxes[0])

    expect(captured).not.toBeNull()
    expect(captured?.mon).toEqual([])
  })

  test('shows validation error for overlapping windows', () => {
    const overlapping: OpenHours = {
      ...allClosed,
      mon: [
        { start: '07:00', end: '14:00' },
        { start: '12:00', end: '20:00' }
      ]
    }

    render(<OpenHoursEditor value={overlapping} onChange={() => {}} />)

    expect(screen.getByText(/overlap/i)).toBeDefined()
  })
})
