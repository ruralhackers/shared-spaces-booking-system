import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CancelBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookerName: string
  nameInput: string
  onNameChange: (value: string) => void
  onConfirm: (scope?: 'this' | 'thisAndFuture') => void
  isPending: boolean
  seriesId?: string | null
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookerName,
  nameInput,
  onNameChange,
  onConfirm,
  isPending,
  seriesId
}: CancelBookingDialogProps) {
  const { t } = useTranslation(['common', 'booking'])
  const [scope, setScope] = useState<'this' | 'thisAndFuture'>('this')

  const handleConfirm = () => {
    if (seriesId) {
      onConfirm(scope)
    } else {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('booking:cancelConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('booking:cancelConfirmDescription', { name: bookerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          placeholder={t('booking:enterNameToCancel')}
          value={nameInput}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={isPending}
        />

        {seriesId && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('booking:cancelScope')}</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-this"
                  name="cancelScope"
                  value="this"
                  checked={scope === 'this'}
                  onChange={(e) => setScope(e.target.value as 'this')}
                  className="w-4 h-4"
                />
                <Label htmlFor="scope-this" className="cursor-pointer font-normal">
                  {t('booking:thisBookingOnly')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-future"
                  name="cancelScope"
                  value="thisAndFuture"
                  checked={scope === 'thisAndFuture'}
                  onChange={(e) => setScope(e.target.value as 'thisAndFuture')}
                  className="w-4 h-4"
                />
                <Label htmlFor="scope-future" className="cursor-pointer font-normal">
                  {t('booking:thisAndAllFuture')}
                </Label>
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {t('booking:confirmCancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
