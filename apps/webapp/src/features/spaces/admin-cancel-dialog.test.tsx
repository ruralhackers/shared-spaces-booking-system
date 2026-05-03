import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AdminCancelDialog } from './admin-cancel-dialog'

describe('The AdminCancelDialog', () => {
  afterEach(cleanup)

  test('displays a cancel button for the admin', () => {
    render(<AdminCancelDialog bookerName="Ana" onConfirm={() => {}} isPending={false} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
  })

  test('shows a confirmation dialog when admin initiates cancellation', () => {
    render(<AdminCancelDialog bookerName="Ana" onConfirm={() => {}} isPending={false} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(screen.getByText(/cancel booking/i)).toBeDefined()
  })

  test('confirms cancellation when admin accepts the dialog', () => {
    const onConfirm = mock(() => {})

    render(<AdminCancelDialog bookerName="Ana" onConfirm={onConfirm} isPending={false} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, cancel/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('prevents additional cancellation attempts while one is in progress', () => {
    render(<AdminCancelDialog bookerName="Ana" onConfirm={() => {}} isPending />)

    const trigger = screen.getByRole('button', { name: /cancel/i })

    expect((trigger as HTMLButtonElement).disabled).toBe(true)
  })

  test('preserves booking when admin dismisses the dialog', () => {
    const onConfirm = mock(() => {})

    render(<AdminCancelDialog bookerName="Ana" onConfirm={onConfirm} isPending={false} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    const dismissButton = screen
      .getAllByText(/^cancel$/i)
      .find((el) => el.tagName === 'BUTTON' && !el.textContent?.includes('Yes'))
    fireEvent.click(dismissButton as HTMLElement)

    expect(onConfirm).not.toHaveBeenCalled()
  })
})
