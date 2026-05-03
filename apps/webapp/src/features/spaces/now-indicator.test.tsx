import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { NowIndicator } from './now-indicator'

const HOUR_ROW_HEIGHT = 56
const TIMELINE_START_HOUR = 9

describe('The NowIndicator component', () => {
  afterEach(cleanup)

  // 3.1 RED: renders horizontal line at current time position
  test('renders at correct top position for current time', () => {
    // current time = 10:30 → top = (10.5 - 9) * 56 = 84px
    const currentTime = new Date('2026-05-03T10:30:00')

    render(
      <NowIndicator
        date="2026-05-03"
        currentTime={currentTime}
        hourRowHeight={HOUR_ROW_HEIGHT}
        timelineStartHour={TIMELINE_START_HOUR}
      />
    )

    const indicator = screen.getByTestId('now-indicator')
    expect((indicator as HTMLElement).style.top).toBe('84px')
  })

  // 3.7 RED: only renders when date is today
  test('returns null when date is not today', () => {
    const currentTime = new Date()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    render(
      <NowIndicator
        date={tomorrow}
        currentTime={currentTime}
        hourRowHeight={HOUR_ROW_HEIGHT}
        timelineStartHour={TIMELINE_START_HOUR}
      />
    )

    expect(() => screen.getByTestId('now-indicator')).toThrow()
  })

  test('renders when date is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    const currentTime = new Date()

    render(
      <NowIndicator
        date={today}
        currentTime={currentTime}
        hourRowHeight={HOUR_ROW_HEIGHT}
        timelineStartHour={TIMELINE_START_HOUR}
      />
    )

    expect(screen.getByTestId('now-indicator')).toBeDefined()
  })
})
