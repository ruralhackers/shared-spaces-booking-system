import { forwardRef } from 'react'

interface NowIndicatorProps {
  date: string
  currentTime: Date
  hourRowHeight: number
  timelineStartHour: number
}

export const NowIndicator = forwardRef<HTMLDivElement, NowIndicatorProps>(function NowIndicator(
  { date, currentTime, hourRowHeight, timelineStartHour },
  ref
) {
  const today = new Date().toISOString().slice(0, 10)
  if (date !== today) return null

  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()
  const top = (hours + minutes / 60 - timelineStartHour) * hourRowHeight

  return (
    <div
      ref={ref}
      data-testid="now-indicator"
      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      <div className="flex-1 h-px bg-red-500" />
    </div>
  )
})
