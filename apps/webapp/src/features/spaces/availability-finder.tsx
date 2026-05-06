import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/env'
import { api } from '@/trpc/react'
import { AvailabilityResultsList } from './availability-results-list'
import { AvailabilityTimePicker } from './availability-time-picker'
import { writeStoredBookerName } from './booker-name-storage'
import { QuickBookSheet } from './quick-book-sheet'

type Preset = 'today' | 'tomorrow' | 'other' | null

interface SheetData {
  space: { id: string; slug: string; name: string }
  date: string
  start: string
  end: string
}

interface SearchParams {
  startsAt: string
  endsAt: string
}

// Heuristic: if the next round hour would be >= 23:00 local time, we consider
// today "closed" and fall back to tomorrow's first open hour.
const LATE_NIGHT_HOUR = 23

function nextRoundHour(now: Date, tz: string): { hhmm: string; fellBack: boolean } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')

  const nextH = m === 0 ? h : h + 1

  if (nextH >= LATE_NIGHT_HOUR) {
    // Fall back to tomorrow 09:00 as default first open hour
    return { hhmm: '09:00', fellBack: true }
  }

  return { hhmm: `${String(nextH).padStart(2, '0')}:00`, fellBack: false }
}

function addHour(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  const nextH = Math.min(h + 1, 23)
  return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function localDateString(now: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)
}

function tomorrowDateString(now: Date, tz: string): string {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return localDateString(tomorrow, tz)
}

function buildIso(date: string, hhmm: string, tz: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  // Build UTC by subtracting the TZ offset so that the result represents
  // the correct local time when interpreted in the target timezone.
  const approx = new Date(Date.UTC(year, month - 1, day, h, m, 0))
  const offsetMinutes = getLocalOffset(approx, tz)
  return new Date(approx.getTime() - offsetMinutes * 60_000).toISOString()
}

function getLocalOffset(date: Date, tz: string): number {
  // Returns offset in minutes: localTime = UTC + offset
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  return (tzDate.getTime() - utcDate.getTime()) / 60_000
}

const DEFAULT_TZ = env.VITE_BOOKING_TZ

interface AvailabilityFinderProps {
  // Allow injecting "now" for testing
  now?: Date
}

export function AvailabilityFinder({ now: nowProp }: AvailabilityFinderProps = {}) {
  const { t } = useTranslation(['spaces', 'common'])
  const navigate = useNavigate()

  const now = nowProp ?? new Date()
  const tz = DEFAULT_TZ

  const [preset, setPreset] = useState<Preset>(null)
  const [chosenDate, setChosenDate] = useState('')
  const [defaultStart, setDefaultStart] = useState('09:00')
  const [defaultEnd, setDefaultEnd] = useState('10:00')
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)
  const [submittedStart, setSubmittedStart] = useState('')
  const [submittedEnd, setSubmittedEnd] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [todayFellBack, setTodayFellBack] = useState(false)

  const {
    data: results,
    isLoading,
    error,
    refetch
  } = api.spaces.availability.useQuery(searchParams ?? { startsAt: '', endsAt: '' }, {
    enabled: !!searchParams
  })

  const bookMutation = api.spaces.book.useMutation({
    onSuccess: (_data, variables) => {
      writeStoredBookerName(variables.bookerName)
      setShowSheet(false)
      setSheetData(null)
      toast.success(t('booking:bookingConfirmed'))
      void refetch()
    },
    onError: (e) => {
      toast.error(e.message)
    }
  })

  function handleConfirm(name: string, startsAt: Date, endsAt: Date) {
    if (!sheetData) return
    writeStoredBookerName(name)
    bookMutation.mutate({
      slug: sheetData.space.slug,
      bookerName: name,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    })
  }

  function handleTodayPreset() {
    const { hhmm, fellBack } = nextRoundHour(now, tz)
    const date = fellBack ? tomorrowDateString(now, tz) : localDateString(now, tz)
    setChosenDate(date)
    setDefaultStart(hhmm)
    setDefaultEnd(addHour(hhmm))
    setPreset('today')
    setTodayFellBack(fellBack)
    setSearchParams(null)
  }

  function handleTomorrowPreset() {
    setChosenDate(tomorrowDateString(now, tz))
    setDefaultStart('09:00')
    setDefaultEnd('10:00')
    setPreset('tomorrow')
    setTodayFellBack(false)
    setSearchParams(null)
  }

  function handleOtherPreset() {
    setPreset('other')
    setChosenDate(localDateString(now, tz))
    setTodayFellBack(false)
    setSearchParams(null)
  }

  function handleDatePicked(date: string) {
    setChosenDate(date)
    setDefaultStart('09:00')
    setDefaultEnd('10:00')
  }

  function handleSearch(start: string, end: string) {
    setSubmittedStart(start)
    setSubmittedEnd(end)
    setSearchParams({
      startsAt: buildIso(chosenDate, start, tz),
      endsAt: buildIso(chosenDate, end, tz)
    })
  }

  function handleReserve(space: { id: string; slug: string; name: string }) {
    const start = submittedStart || defaultStart
    const end = submittedEnd || defaultEnd
    setSheetData({ space, date: chosenDate, start, end })
    setShowSheet(true)
  }

  function handleViewDay(spaceSlug: string, date: string) {
    navigate({ to: '/spaces/$slug', params: { slug: spaceSlug }, search: { date } })
  }

  const showTimePicker =
    preset === 'today' || preset === 'tomorrow' || (preset === 'other' && chosenDate !== '')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={preset === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={handleTodayPreset}
        >
          {t('common:today')}
        </Button>
        <Button
          variant={preset === 'tomorrow' ? 'default' : 'outline'}
          size="sm"
          onClick={handleTomorrowPreset}
        >
          {t('spaces:tomorrow')}
        </Button>
        <Button
          variant={preset === 'other' ? 'default' : 'outline'}
          size="sm"
          onClick={handleOtherPreset}
        >
          {t('spaces:otherDate')}
        </Button>
      </div>

      {todayFellBack && (
        <p className="text-sm text-muted-foreground" data-testid="today-closed-hint">
          {t('spaces:todayClosedShowingTomorrow')}
        </p>
      )}

      {preset === 'other' && (
        <div className="space-y-1">
          <Label htmlFor="other-date">{t('spaces:date')}</Label>
          <Input
            id="other-date"
            type="date"
            value={chosenDate}
            min={localDateString(now, tz)}
            className="w-auto"
            onChange={(e) => handleDatePicked(e.target.value)}
          />
        </div>
      )}

      {showTimePicker && (
        <AvailabilityTimePicker
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          date={chosenDate}
          onSubmit={handleSearch}
        />
      )}

      {(searchParams || isLoading) && (
        <AvailabilityResultsList
          results={results ?? []}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => void refetch()}
          onReserve={handleReserve}
          onViewDay={handleViewDay}
          chosenDate={chosenDate}
          chosenStart={submittedStart || defaultStart}
          chosenEnd={submittedEnd || defaultEnd}
        />
      )}

      {showSheet && sheetData && (
        <QuickBookSheet
          open={showSheet}
          onOpenChange={(open) => setShowSheet(open)}
          space={sheetData.space}
          defaultStart={buildIso(sheetData.date, sheetData.start, tz)}
          defaultEnd={buildIso(sheetData.date, sheetData.end, tz)}
          onCancel={() => setShowSheet(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
