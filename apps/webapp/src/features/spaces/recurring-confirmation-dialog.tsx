import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface RecurringConfirmationResult {
  seriesId: string
  created: Array<{ id: string; date: string }>
  skipped: Array<{ date: string; reason: string }>
}

interface RecurringConfirmationDialogProps {
  open: boolean
  onClose: () => void
  result: RecurringConfirmationResult
}

export function RecurringConfirmationDialog({
  open,
  onClose,
  result
}: RecurringConfirmationDialogProps) {
  const { t } = useTranslation(['booking'])

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('booking:recurringBookingCreated')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('booking:bookingsCreatedCount', { count: result.created.length })}
            {result.skipped.length > 0 && (
              <>
                {' • '}
                {t('booking:bookingsSkippedCount', { count: result.skipped.length })}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {result.skipped.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">{t('booking:skippedDates')}</h4>
            <ul className="space-y-2 text-sm">
              {result.skipped.map((skip) => (
                <li key={skip.date} className="flex flex-col gap-1">
                  <span className="font-medium">{skip.date}</span>
                  <span className="text-muted-foreground">{skip.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>{t('booking:close')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
