import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import * as bookerNameStorage from './booker-name-storage'
import { QuickBookSheet } from './quick-book-sheet'

const TEST_SPACE = { id: 'clh1234567890abcdefghijk', slug: 'chill-house', name: 'Chill House' }

describe('The QuickBookSheet component', () => {
  afterEach(cleanup)

  // Task 8.2 RED: renders with pre-filled name
  test('pre-fills name input from readStoredBookerName()', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('Alice')

    render(<QuickBookSheet open={true} onOpenChange={() => {}} space={TEST_SPACE} />)

    const input = screen.getByLabelText('Your name') as HTMLInputElement
    expect(input.value).toBe('Alice')
  })

  test('shows empty input when no stored name', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('')

    render(<QuickBookSheet open={true} onOpenChange={() => {}} space={TEST_SPACE} />)

    const input = screen.getByLabelText('Your name') as HTMLInputElement
    expect(input.value).toBe('')
  })

  // Task 8.4 RED: uses pre-filled times when defaults are passed
  test('shows pre-filled time range in subtitle when defaults passed', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('')

    render(
      <QuickBookSheet
        open={true}
        onOpenChange={() => {}}
        space={TEST_SPACE}
        defaultStart="2026-05-03T17:00:00.000Z"
        defaultEnd="2026-05-03T19:00:00.000Z"
      />
    )

    // 14:00 and 16:00 Buenos Aires time
    const subtitle = screen.getByTestId('sheet-subtitle')
    expect(subtitle.textContent).toContain('14:00')
    expect(subtitle.textContent).toContain('16:00')
  })

  // Task 8.6 RED: falls back to "now + 1h" when defaults absent
  test('falls back to now + 1h in subtitle when no defaults', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('')
    // Fix current time for test predictability
    const fixedNow = new Date('2026-05-03T17:37:00.000Z') // 14:37 Buenos Aires
    spyOn(globalThis.Date, 'now').mockReturnValue(fixedNow.getTime())

    render(<QuickBookSheet open={true} onOpenChange={() => {}} space={TEST_SPACE} />)

    const subtitle = screen.getByTestId('sheet-subtitle')
    expect(subtitle.textContent).toContain('14:37')
    expect(subtitle.textContent).toContain('15:37')
  })

  test('renders title "Confirm booking"', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('')

    render(<QuickBookSheet open={true} onOpenChange={() => {}} space={TEST_SPACE} />)

    expect(screen.getByRole('heading', { name: 'Confirm booking' })).toBeDefined()
  })

  test('renders confirm button', () => {
    spyOn(bookerNameStorage, 'readStoredBookerName').mockReturnValue('')

    render(<QuickBookSheet open={true} onOpenChange={() => {}} space={TEST_SPACE} />)

    expect(screen.getByRole('button', { name: 'Confirm booking' })).toBeDefined()
  })
})
