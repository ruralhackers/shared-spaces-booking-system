import { toZonedTime } from 'date-fns-tz'
import { useEffect, useRef, useState } from 'react'
import { bookingTz } from '@/lib/format-time'
import { NowIndicator } from './now-indicator'

interface Booking {
  id: string
  bookerName: string
  startsAt: string
  endsAt: string
  seriesId: string | null
  spaceId: string
  spaceSlug: string
  spaceDisplayName: string
  status: 'active' | 'cancelled'
  createdAt: string
  cancelledAt: string | null
  cancelledBy: 'booker' | 'admin' | null
}

interface OpenHoursWindow {
  start: string
  end: string
}

interface DayTimelineProps {
  bookings: Booking[]
  openHours: OpenHoursWindow[]
  date: string
  onSlotTap: (hour: number) => void
  onBookingTap: (bookingId: string, bookerName: string) => void
  spaceColor?: string
}

const HOUR_ROW_HEIGHT = 56

function parseHhmm(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h + m / 60
}

function toTimelineHour(isoString: string): number {
  const tz = bookingTz()
  const zoned = toZonedTime(new Date(isoString), tz)
  return zoned.getHours() + zoned.getMinutes() / 60
}

function buildHourRows(openHours: OpenHoursWindow[], bookings: Booking[]): number[] {
  const openSet = new Set<number>()
  for (const w of openHours) {
    const start = Math.floor(parseHhmm(w.start))
    const end = Math.floor(parseHhmm(w.end))
    for (let h = start; h < end; h++) {
      openSet.add(h)
    }
  }

  // Add hours that have bookings even if outside open hours
  for (const b of bookings) {
    const startHour = Math.floor(toTimelineHour(b.startsAt))
    openSet.add(startHour)
  }

  return [...openSet].sort((a, b) => a - b)
}

function isHourOpen(hour: number, openHours: OpenHoursWindow[]): boolean {
  for (const w of openHours) {
    const start = Math.floor(parseHhmm(w.start))
    const end = Math.floor(parseHhmm(w.end))
    if (hour >= start && hour < end) return true
  }
  return false
}

function detectOverlaps(bookings: Booking[]): Map<string, number> {
  const columns = new Map<string, number>()
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  )

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    if (!a) continue
    let col = 0
    for (let j = 0; j < i; j++) {
      const b = sorted[j]
      if (!b) continue
      const aStart = new Date(a.startsAt).getTime()
      const aEnd = new Date(a.endsAt).getTime()
      const bStart = new Date(b.startsAt).getTime()
      const bEnd = new Date(b.endsAt).getTime()
      if (aStart < bEnd && aEnd > bStart) {
        col = 1 - (columns.get(b.id) ?? 0)
        break
      }
    }
    columns.set(a.id, col)
  }
  return columns
}

function hasAnyOverlap(bookings: Booking[]): boolean {
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i]
      const b = bookings[j]
      if (!a || !b) continue
      const aStart = new Date(a.startsAt).getTime()
      const aEnd = new Date(a.endsAt).getTime()
      const bStart = new Date(b.startsAt).getTime()
      const bEnd = new Date(b.endsAt).getTime()
      if (aStart < bEnd && aEnd > bStart) return true
    }
  }
  return false
}

export function DayTimeline({
  bookings,
  openHours,
  date,
  onSlotTap,
  onBookingTap,
  spaceColor
}: DayTimelineProps) {
  const hourRows = buildHourRows(openHours, bookings)
  const timelineStartHour = hourRows[0] ?? 0
  const nowRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [isToday])

  useEffect(() => {
    if (isToday) {
      nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isToday])

  const totalHeight = hourRows.length * HOUR_ROW_HEIGHT
  const hasOverlap = hasAnyOverlap(bookings)
  const overlapColumns = hasOverlap ? detectOverlaps(bookings) : new Map<string, number>()

  return (
    <div className="relative select-none" style={{ height: `${totalHeight}px` }}>
      {/* Hour rows */}
      {hourRows.map((hour, idx) => {
        const open = isHourOpen(hour, openHours)
        const top = idx * HOUR_ROW_HEIGHT
        return (
          <button
            type="button"
            key={hour}
            data-testid={`hour-row-${hour}`}
            className={`absolute left-0 right-0 flex border-b border-border cursor-pointer text-left w-full ${open ? 'hover:bg-muted/30' : 'bg-muted/60'}`}
            style={{ top: `${top}px`, height: `${HOUR_ROW_HEIGHT}px` }}
            onClick={() => onSlotTap(hour)}
          >
            <div className="w-12 shrink-0 flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-muted-foreground font-mono">
                {String(hour).padStart(2, '0')}
              </span>
            </div>
            {!open && (
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  closed
                </span>
              </div>
            )}
          </button>
        )
      })}

      {/* Booking blocks */}
      {bookings.map((booking) => {
        const startHourFrac = toTimelineHour(booking.startsAt)
        const endHourFrac = toTimelineHour(booking.endsAt)
        const durationHours = endHourFrac - startHourFrac
        const top = (startHourFrac - timelineStartHour) * HOUR_ROW_HEIGHT
        const height = Math.max(durationHours * HOUR_ROW_HEIGHT, 20)

        const col = overlapColumns.get(booking.id) ?? 0
        const width = hasOverlap ? '50%' : '100%'
        const leftOffset = hasOverlap ? (col === 0 ? '0%' : '50%') : '12px'
        const rightOffset = hasOverlap ? undefined : '4px'

        return (
          <button
            type="button"
            key={booking.id}
            data-testid={`booking-block-${booking.id}`}
            className="absolute flex items-center justify-center rounded text-white text-xs font-medium cursor-pointer z-10 overflow-hidden px-1"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              width: hasOverlap ? width : `calc(100% - 52px - 4px)`,
              left: hasOverlap ? leftOffset : '52px',
              right: rightOffset,
              backgroundColor: spaceColor ?? '#6366f1'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onBookingTap(booking.id, booking.bookerName)
            }}
          >
            <span className="truncate">{booking.bookerName}</span>
          </button>
        )
      })}

      {/* Now indicator */}
      {isToday && (
        <NowIndicator
          ref={nowRef}
          date={date}
          currentTime={currentTime}
          hourRowHeight={HOUR_ROW_HEIGHT}
          timelineStartHour={timelineStartHour}
        />
      )}
    </div>
  )
}
