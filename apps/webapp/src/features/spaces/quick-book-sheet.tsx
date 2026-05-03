import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { formatTime } from '@/lib/format-time'
import { readStoredBookerName } from './booker-name-storage'

interface QuickBookSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  space: { id: string; slug: string; name: string }
  defaultStart?: Date | string
  defaultEnd?: Date | string
  defaultDate?: Date | string
  onConfirm?: (name: string, startsAt: Date, endsAt: Date) => void
  onCancel?: () => void
}

function computeTimes(
  defaultStart?: Date | string,
  defaultEnd?: Date | string
): { startsAt: Date; endsAt: Date } {
  if (defaultStart && defaultEnd) {
    return {
      startsAt: new Date(defaultStart),
      endsAt: new Date(defaultEnd)
    }
  }
  const now = new Date(Date.now())
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  return { startsAt: now, endsAt: oneHourLater }
}

function durationLabel(startsAt: Date, endsAt: Date): string {
  const diffMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000)
  if (diffMinutes < 60) return `${diffMinutes}min`
  const hours = diffMinutes / 60
  return `${hours}h`
}

export function QuickBookSheet({
  open,
  onOpenChange,
  space,
  defaultStart,
  defaultEnd,
  onConfirm,
  onCancel
}: QuickBookSheetProps) {
  const { t } = useTranslation(['booking', 'spaces'])
  const [name, setName] = useState(() => readStoredBookerName())
  const { startsAt, endsAt } = computeTimes(defaultStart, defaultEnd)

  const startLabel = formatTime(startsAt.toISOString())
  const endLabel = formatTime(endsAt.toISOString())
  const duration = durationLabel(startsAt, endsAt)

  function handleConfirm() {
    onConfirm?.(name, startsAt, endsAt)
  }

  function handleCancel() {
    onOpenChange(false)
    onCancel?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t('booking:confirmBooking')}</SheetTitle>
          <SheetDescription data-testid="sheet-subtitle">
            {space.name} · Today {startLabel} – {endLabel} ({duration})
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="booker-name">{t('booking:yourName')}</Label>
            <Input
              id="booker-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('booking:yourName')}
            />
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t('booking:close')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('booking:confirmBooking')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
