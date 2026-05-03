import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CancelBookingDialog } from './cancel-booking-dialog'

describe('The CancelBookingDialog', () => {
  afterEach(cleanup)

  test('displays a cancel button for the user', () => {
    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput=""
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
  })

  test('shows a confirmation dialog when user initiates cancellation', () => {
    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(screen.getByText(/cancel booking/i)).toBeDefined()
  })

  test('confirms cancellation when user accepts the dialog', () => {
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('preserves booking when user dismisses the dialog', () => {
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    const dismissButton = screen
      .getAllByText(/^cancel$/i)
      .find((el) => el.tagName === 'BUTTON' && !el.textContent?.includes('Yes'))
    fireEvent.click(dismissButton as HTMLElement)

    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('prevents additional cancellation attempts while one is in progress', () => {
    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending
      />
    )

    const trigger = screen.getByRole('button', { name: /cancel/i })

    expect((trigger as HTMLButtonElement).disabled).toBe(true)
  })

  test('notifies parent when user types in the name input', () => {
    const onNameChange = mock(() => {})

    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput=""
        onNameChange={onNameChange}
        onConfirm={() => {}}
        isPending={false}
      />
    )

    const input = screen.getByPlaceholderText(/enter.*name/i)
    fireEvent.change(input, { target: { value: 'Ana' } })

    expect(onNameChange).toHaveBeenCalledWith('Ana')
  })

  test('shows scope selector when booking has seriesId', () => {
    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
        seriesId="series-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByLabelText(/this booking only/i)).toBeDefined()
    expect(screen.getByLabelText(/this and all future/i)).toBeDefined()
  })

  test('calls onConfirm with scope when cancelling a series booking', () => {
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
        seriesId="series-1"
        bookingId="booking-1"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    // Select "this and future" scope
    const futureRadio = screen.getByLabelText(/this and all future/i)
    fireEvent.click(futureRadio)

    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(onConfirm).toHaveBeenCalledWith('thisAndFuture')
  })
})
