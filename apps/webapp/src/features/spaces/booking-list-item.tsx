import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/format-time'
import { CancelBookingDialog } from './cancel-booking-dialog'

interface Booking {
  id: string
  bookerName: string
  startsAt: string
  endsAt: string
  seriesId: string | null
}

interface BookingListItemProps {
  booking: Booking
  cancelName: string
  onCancelNameChange: (value: string) => void
  onCancel: (scope?: 'this' | 'thisAndFuture') => void
  isPending: boolean
}

export function BookingListItem({
  booking,
  cancelName,
  onCancelNameChange,
  onCancel,
  isPending
}: BookingListItemProps) {
  const { t } = useTranslation(['common', 'booking'])
  const isPast = new Date(booking.endsAt) < new Date()

  return (
    <li className={`py-3 space-y-2 ${isPast ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {booking.bookerName}
            {booking.seriesId && (
              <span className="ml-1 text-muted-foreground" title={t('booking:recurringBooking')}>
                ↻
              </span>
            )}
          </span>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            {t('active')}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {formatTime(booking.startsAt)} – {formatTime(booking.endsAt)}
        </span>
      </div>
      <CancelBookingDialog
        bookerName={booking.bookerName}
        nameInput={cancelName}
        onNameChange={onCancelNameChange}
        onConfirm={onCancel}
        isPending={isPending}
        seriesId={booking.seriesId}
      />
    </li>
  )
}
