import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface AdminCancelDialogProps {
  bookerName: string
  onConfirm: () => void
  isPending: boolean
}

export function AdminCancelDialog({ bookerName, onConfirm, isPending }: AdminCancelDialogProps) {
  const { t } = useTranslation(['common', 'admin'])

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive hover:border-destructive/50 shrink-0"
          disabled={isPending}
          aria-label={t('admin:cancelBookingFor', { name: bookerName })}
        >
          {t('cancel')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin:cancelBookingTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin:cancelBookingDescription', { name: bookerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {t('admin:confirmCancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
