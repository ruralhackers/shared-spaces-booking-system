import { createFileRoute, Link } from '@tanstack/react-router'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { BookingFormData } from '@/features/spaces/booking-form'
import { BookingForm } from '@/features/spaces/booking-form'
import { BookingListItem } from '@/features/spaces/booking-list-item'
import { RecurringConfirmationDialog } from '@/features/spaces/recurring-confirmation-dialog'
import { todayInBookingTz } from '@/lib/format-time'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/spaces/$slug')({
  component: SpacePage
})

function SpacePage() {
  const { t } = useTranslation(['common', 'booking'])
  const { slug } = Route.useParams()
  const [date, setDate] = useState(todayInBookingTz)
  const utils = api.useUtils()

  const { data, isLoading, error } = api.spaces.dayView.useQuery({ slug, date })

  const [recurringResult, setRecurringResult] = useState<{
    seriesId: string
    created: Array<{ id: string; date: string }>
    skipped: Array<{ date: string; reason: string }>
  } | null>(null)

  const bookMutation = api.spaces.book.useMutation({
    onSuccess: () => {
      utils.spaces.dayView.invalidate({ slug, date })
      toast.success(t('booking:bookingConfirmed'))
    },
    onError: (e) => toast.error(e.message)
  })

  const bookSeriesMutation = api.spaces.bookingSeries.create.useMutation({
    onSuccess: (result) => {
      utils.spaces.dayView.invalidate({ slug, date })
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
      toast.success(t('booking:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  const cancelSeriesMutation = api.spaces.bookingSeries.cancelByBooker.useMutation({
    onSuccess: () => {
      utils.spaces.dayView.invalidate({ slug, date })
      toast.success(t('booking:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  const [cancelName, setCancelName] = useState<Record<string, string>>({})
  const bookingFormRef = useRef<HTMLElement>(null)

  function shiftDay(delta: number) {
    setDate((d) => format(addDays(parseISO(d), delta), 'yyyy-MM-dd'))
  }

  function handleCancel(id: string, seriesId: string | null, scope?: 'this' | 'thisAndFuture') {
    const name = cancelName[id] ?? ''
    if (seriesId && scope) {
      cancelSeriesMutation.mutate({
        seriesId,
        scope,
        occurrenceId: id,
        bookerName: name
      })
    } else {
      cancelMutation.mutate({ id, bookerName: name })
    }
  }

  function handleBookingSubmit(data: BookingFormData) {
    if (data.type === 'single') {
      bookMutation.mutate({
        slug,
        bookerName: data.bookerName,
        startsAt: data.startsAt,
        endsAt: data.endsAt
      })
    } else {
      bookSeriesMutation.mutate({
        slug,
        bookerName: data.bookerName,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        frequency: data.frequency,
        end: data.end
      })
    }
  }

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
        <Button
          variant="outline"
          size="sm"
          disabled={bookMutation.isPending}
          onClick={() =>
            bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        >
          {t('booking:book')}
        </Button>
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
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setDate(todayInBookingTz())}
              >
                {t('today')}
              </Button>
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

          {/* Bookings list */}
          <section className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {t('bookings')}
            </h2>

            {data.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t('booking:noBookings')}</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {data.bookings.map((b) => (
                  <BookingListItem
                    key={b.id}
                    booking={b}
                    cancelName={cancelName[b.id] ?? ''}
                    onCancelNameChange={(value) =>
                      setCancelName((prev) => ({ ...prev, [b.id]: value }))
                    }
                    onCancel={(scope) => handleCancel(b.id, b.seriesId, scope)}
                    isPending={cancelMutation.isPending || cancelSeriesMutation.isPending}
                  />
                ))}
              </ul>
            )}
          </section>

          <Separator className="mb-6" />

          {/* Booking form */}
          <section ref={bookingFormRef}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              {t('booking:newBooking')}
            </h2>
            <BookingForm
              date={date}
              onSubmit={handleBookingSubmit}
              isPending={bookMutation.isPending || bookSeriesMutation.isPending}
            />
          </section>
        </>
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
