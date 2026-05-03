import { createFileRoute, Link } from '@tanstack/react-router'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { AdvancedBookingFormData } from '@/features/spaces/advanced-booking-sheet'
import { AdvancedBookingSheet } from '@/features/spaces/advanced-booking-sheet'
import { readStoredBookerName } from '@/features/spaces/booker-name-storage'
import { CancelBookingDialog } from '@/features/spaces/cancel-booking-dialog'
import { DayTimeline } from '@/features/spaces/day-timeline'
import { QuickBookSheet } from '@/features/spaces/quick-book-sheet'
import { RecurringConfirmationDialog } from '@/features/spaces/recurring-confirmation-dialog'
import { todayInBookingTz } from '@/lib/format-time'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/spaces/$slug')({
  validateSearch: z.object({ date: z.string().optional() }),
  component: SpacePage
})

function parseDate(raw: string | undefined): string {
  if (!raw) return todayInBookingTz()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return raw
  }
  return todayInBookingTz()
}

function SpacePage() {
  const { t } = useTranslation(['common', 'booking'])
  const { slug } = Route.useParams()
  const { date: dateParam } = Route.useSearch()
  const navigate = Route.useNavigate()

  const date = parseDate(dateParam)
  const today = todayInBookingTz()
  const isToday = date === today

  const utils = api.useUtils()

  const { data, isLoading, error } = api.spaces.dayView.useQuery({ slug, date })

  const [recurringResult, setRecurringResult] = useState<{
    seriesId: string
    created: Array<{ id: string; date: string }>
    skipped: Array<{ date: string; reason: string }>
  } | null>(null)

  // Quick book sheet state
  const [quickBookOpen, setQuickBookOpen] = useState(false)
  const [quickBookDefaults, setQuickBookDefaults] = useState<{
    start: string
    end: string
  }>({ start: '', end: '' })

  // Advanced booking sheet state
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [cancelBookingSeriesId, setCancelBookingSeriesId] = useState<string | null>(null)
  const [cancelBookingName, setCancelBookingName] = useState('')
  const [cancelNameInput, setCancelNameInput] = useState('')

  const bookMutation = api.spaces.book.useMutation({
    onSuccess: () => {
      utils.spaces.dayView.invalidate({ slug, date })
      setQuickBookOpen(false)
      toast.success(t('booking:bookingConfirmed'))
    },
    onError: (e) => toast.error(e.message)
  })

  const bookSeriesMutation = api.spaces.bookingSeries.create.useMutation({
    onSuccess: (result) => {
      utils.spaces.dayView.invalidate({ slug, date })
      setAdvancedOpen(false)
      if (result.skipped.length > 0) {
        setRecurringResult(result)
      } else {
        toast.success(t('booking:bookingConfirmed'))
      }
    },
    onError: (e) => toast.error(e.message)
  })

  const cancelMutation = api.spaces.cancel.useMutation({
    onSuccess: () => {
      utils.spaces.dayView.invalidate({ slug, date })
      setCancelDialogOpen(false)
      setCancelBookingId(null)
      setCancelBookingSeriesId(null)
      setCancelNameInput('')
      toast.success(t('booking:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  const cancelSeriesMutation = api.spaces.bookingSeries.cancelByBooker.useMutation({
    onSuccess: () => {
      utils.spaces.dayView.invalidate({ slug, date })
      setCancelDialogOpen(false)
      setCancelBookingId(null)
      setCancelBookingSeriesId(null)
      setCancelNameInput('')
      toast.success(t('booking:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  function setDate(newDate: string) {
    navigate({ search: (prev) => ({ ...prev, date: newDate }) })
  }

  function shiftDay(delta: number) {
    setDate(format(addDays(parseISO(date), delta), 'yyyy-MM-dd'))
  }

  function handleSlotTap(hour: number) {
    const start = `${String(hour).padStart(2, '0')}:00`
    const bookings = data?.bookings ?? []
    const openHours = data?.openHoursForDay ?? []

    // Find next booking start time
    const startMs = new Date(`${date}T${start}:00`).getTime()
    const nextBookingStart = bookings
      .map((b) => new Date(b.startsAt).getTime())
      .filter((t) => t > startMs)
      .sort((a, b) => a - b)[0]

    // Find space close time for this slot
    let closeTimeMs: number | null = null
    for (const w of openHours) {
      const wStartFrac = Number(w.start.split(':')[0]) + Number(w.start.split(':')[1]) / 60
      const wEndFrac = Number(w.end.split(':')[0]) + Number(w.end.split(':')[1]) / 60
      if (hour >= wStartFrac && hour < wEndFrac) {
        closeTimeMs = new Date(`${date}T${w.end}:00`).getTime()
        break
      }
    }

    const defaultEndMs = startMs + 60 * 60 * 1000
    let endMs = defaultEndMs
    if (nextBookingStart && nextBookingStart < endMs) endMs = nextBookingStart
    if (closeTimeMs && closeTimeMs < endMs) endMs = closeTimeMs

    const endDate = new Date(endMs)
    const end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    setQuickBookDefaults({ start, end })
    setQuickBookOpen(true)
  }

  function handleBookingTap(bookingId: string, bookerName: string) {
    const stored = readStoredBookerName()
    if (stored && stored === bookerName) {
      const booking = data?.bookings.find((b) => b.id === bookingId)
      setCancelBookingId(bookingId)
      setCancelBookingSeriesId(booking?.seriesId ?? null)
      setCancelBookingName(bookerName)
      setCancelNameInput('')
      setCancelDialogOpen(true)
    }
  }

  function handleCancelConfirm(scope?: 'this' | 'thisAndFuture') {
    if (!cancelBookingId) return
    if (cancelBookingSeriesId && scope) {
      cancelSeriesMutation.mutate({
        seriesId: cancelBookingSeriesId,
        scope,
        occurrenceId: cancelBookingId,
        bookerName: cancelNameInput
      })
    } else {
      cancelMutation.mutate({ id: cancelBookingId, bookerName: cancelNameInput })
    }
  }

  function handleAdvancedSubmit(formData: AdvancedBookingFormData) {
    if (formData.type === 'single') {
      bookMutation.mutate({
        slug,
        bookerName: formData.bookerName,
        startsAt: formData.startsAt,
        endsAt: formData.endsAt
      })
    } else {
      bookSeriesMutation.mutate({
        slug,
        bookerName: formData.bookerName,
        startsAt: formData.startsAt,
        endsAt: formData.endsAt,
        frequency: formData.frequency,
        end: formData.end
      })
    }
  }

  const closedDayWeekday =
    data?.openHoursForDay?.length === 0
      ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en', { weekday: 'long' })
      : null

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Sticky top bar */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-2 -mx-6 px-6 py-2 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('allSpaces')}
        </Link>
      </div>

      {isLoading && !data && (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {data && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              {data.space.color && (
                <span
                  className="inline-block w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: data.space.color }}
                />
              )}
              <h1 className="text-xl font-semibold">{data.space.displayName}</h1>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setDate(today)}
                >
                  {t('today')}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{data.space.description}</p>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shiftDay(-1)}
              aria-label={t('booking:previousDay')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 w-36 text-xs px-2"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => shiftDay(1)}
              aria-label={t('booking:nextDay')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Timeline or closed state */}
          {closedDayWeekday ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t('booking:closedOn', { weekday: closedDayWeekday })}
            </p>
          ) : (
            <div className="mb-6 overflow-y-auto max-h-[600px]">
              <DayTimeline
                bookings={data.bookings}
                openHours={data.openHoursForDay}
                date={date}
                onSlotTap={handleSlotTap}
                onBookingTap={handleBookingTap}
                spaceColor={data.space.color ?? undefined}
              />
            </div>
          )}

          {/* Advanced booking button */}
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => setAdvancedOpen(true)}>
              {t('booking:advancedBooking')}
            </Button>
          </div>
        </>
      )}

      {/* Quick book sheet */}
      {data && (
        <QuickBookSheet
          open={quickBookOpen}
          onOpenChange={setQuickBookOpen}
          space={{ id: data.space.id, slug, name: data.space.displayName }}
          defaultStart={
            quickBookDefaults.start ? `${date}T${quickBookDefaults.start}:00` : undefined
          }
          defaultEnd={quickBookDefaults.end ? `${date}T${quickBookDefaults.end}:00` : undefined}
          onConfirm={(name, startsAt, endsAt) => {
            bookMutation.mutate({
              slug,
              bookerName: name,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString()
            })
          }}
        />
      )}

      {/* Advanced booking sheet */}
      {data && (
        <AdvancedBookingSheet
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
          date={date}
          spaceName={data.space.displayName}
          onSubmit={handleAdvancedSubmit}
          isPending={bookMutation.isPending || bookSeriesMutation.isPending}
        />
      )}

      {/* Cancel booking dialog */}
      {cancelDialogOpen && cancelBookingId && (
        <CancelBookingDialog
          bookerName={cancelBookingName}
          nameInput={cancelNameInput}
          onNameChange={setCancelNameInput}
          onConfirm={handleCancelConfirm}
          isPending={cancelMutation.isPending || cancelSeriesMutation.isPending}
          seriesId={cancelBookingSeriesId}
        />
      )}

      {recurringResult && (
        <RecurringConfirmationDialog
          open={true}
          onClose={() => setRecurringResult(null)}
          result={recurringResult}
        />
      )}
    </div>
  )
}
