import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CancelBookingDialog } from './cancel-booking-dialog'

describe('The CancelBookingDialog', () => {
  afterEach(cleanup)

  test('shows confirmation dialog when open is true', () => {
    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput=""
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />
    )

    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(screen.getByText(/cancel booking/i)).toBeDefined()
  })

  test('does not show dialog when open is false', () => {
    render(
      <CancelBookingDialog
        open={false}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput=""
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
      />
    )

    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  test('confirms cancellation when user accepts the dialog', () => {
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('calls onOpenChange(false) when user dismisses the dialog', () => {
    const onOpenChange = mock(() => {})
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={onOpenChange}
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('disables confirm button while cancellation is in progress', () => {
    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={true}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /yes, cancel/i })

    expect((confirmButton as HTMLButtonElement).disabled).toBe(true)
  })

  test('notifies parent when user types in the name input', () => {
    const onNameChange = mock(() => {})

    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={() => {}}
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
        open={true}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={() => {}}
        isPending={false}
        seriesId="series-1"
      />
    )

    expect(screen.getByLabelText(/this booking only/i)).toBeDefined()
    expect(screen.getByLabelText(/this and all future/i)).toBeDefined()
  })

  test('calls onConfirm with scope when cancelling a series booking', () => {
    const onConfirm = mock(() => {})

    render(
      <CancelBookingDialog
        open={true}
        onOpenChange={() => {}}
        bookerName="Ana"
        nameInput="Ana"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        isPending={false}
        seriesId="series-1"
      />
    )

    const futureRadio = screen.getByLabelText(/this and all future/i)
    fireEvent.click(futureRadio)

    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(onConfirm).toHaveBeenCalledWith('thisAndFuture')
  })
})
