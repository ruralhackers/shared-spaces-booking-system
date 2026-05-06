import { fromZonedTime } from 'date-fns-tz'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { bookingTz } from '@/lib/format-time'
import { readStoredBookerName, writeStoredBookerName } from './booker-name-storage'

interface SingleBookingData {
  type: 'single'
  bookerName: string
  startsAt: string
  endsAt: string
}

interface RecurringBookingData {
  type: 'recurring'
  bookerName: string
  startsAt: string
  endsAt: string
  frequency: 'daily' | 'weekly'
  end: { type: 'date' | 'count'; value: string | number }
}

export type AdvancedBookingFormData = SingleBookingData | RecurringBookingData

interface AdvancedBookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  spaceName: string
  onSubmit: (data: AdvancedBookingFormData) => void
  isPending?: boolean
  defaultStart?: string
  defaultEnd?: string
}

function toBookingInstant(date: string, time: string): string {
  return fromZonedTime(`${date}T${time}:00`, bookingTz()).toISOString()
}

function currentHourString(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  return `${hh}:00`
}

function nextHourString(): string {
  const now = new Date()
  const hh = String((now.getHours() + 1) % 24).padStart(2, '0')
  return `${hh}:00`
}

export function AdvancedBookingSheet({
  open,
  onOpenChange,
  date,
  spaceName,
  onSubmit,
  isPending = false,
  defaultStart,
  defaultEnd
}: AdvancedBookingSheetProps) {
  const { t } = useTranslation(['common', 'booking'])
  const [bookerName, setBookerName] = useState(readStoredBookerName)
  const [startsAt, setStartsAt] = useState(defaultStart ?? currentHourString())
  const [endsAt, setEndsAt] = useState(defaultEnd ?? nextHourString())
  const [isRepeat, setIsRepeat] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [endType, setEndType] = useState<'date' | 'count'>('date')
  const [endDate, setEndDate] = useState('')
  const [occurrenceCount, setOccurrenceCount] = useState(7)

  useEffect(() => {
    if (bookerName.trim()) {
      writeStoredBookerName(bookerName)
    }
  }, [bookerName])

  useEffect(() => {
    if (open) {
      if (defaultStart) setStartsAt(defaultStart)
      if (defaultEnd) setEndsAt(defaultEnd)
    }
  }, [open, defaultStart, defaultEnd])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const startsAtInstant = toBookingInstant(date, startsAt)
    const endsAtInstant = toBookingInstant(date, endsAt)

    if (!isRepeat) {
      onSubmit({
        type: 'single',
        bookerName,
        startsAt: startsAtInstant,
        endsAt: endsAtInstant
      })
    } else {
      onSubmit({
        type: 'recurring',
        bookerName,
        startsAt: startsAtInstant,
        endsAt: endsAtInstant,
        frequency,
        end:
          endType === 'date'
            ? { type: 'date', value: endDate }
            : { type: 'count', value: occurrenceCount }
      })
    }
  }

  function setNow() {
    setStartsAt(currentHourString())
    setEndsAt(nextHourString())
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t('booking:newBooking')} — {spaceName}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 pb-8">
          <div>
            <Label htmlFor="adv-bookerName">{t('booking:name')}</Label>
            <Input
              id="adv-bookerName"
              value={bookerName}
              onChange={(e) => setBookerName(e.target.value)}
              placeholder={t('booking:namePlaceholder')}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>{t('booking:time')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={setNow}
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                {t('booking:setToNow')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="adv-startsAt"
                type="time"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="flex-1"
                aria-label={t('booking:startTime')}
              />
              <span className="text-sm text-muted-foreground">{t('common:to')}</span>
              <Input
                id="adv-endsAt"
                type="time"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="flex-1"
                aria-label={t('booking:endTime')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="adv-isRepeat"
              checked={isRepeat}
              onCheckedChange={setIsRepeat}
              aria-label={t('booking:repeatBooking')}
            />
            <Label htmlFor="adv-isRepeat" className="cursor-pointer">
              {t('booking:repeatBooking')}
            </Label>
          </div>

          {isRepeat && (
            <>
              <div>
                <Label htmlFor="adv-frequency">{t('booking:frequency')}</Label>
                <Select
                  id="adv-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
                  className="mt-1.5"
                >
                  <option value="daily">{t('booking:daily')}</option>
                  <option value="weekly">{t('booking:weekly')}</option>
                </Select>
              </div>

              <div>
                <Label>{t('booking:endsOn')}</Label>
                <div className="flex flex-col gap-3 mt-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="adv-endTypeDate"
                      name="adv-endType"
                      value="date"
                      checked={endType === 'date'}
                      onChange={(e) => setEndType(e.target.value as 'date')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="adv-endTypeDate" className="cursor-pointer flex-1">
                      {t('booking:untilDate')}
                    </Label>
                    {endType === 'date' && (
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required={isRepeat && endType === 'date'}
                        className="flex-1"
                        aria-label={t('booking:untilDate')}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="adv-endTypeCount"
                      name="adv-endType"
                      value="count"
                      checked={endType === 'count'}
                      onChange={(e) => setEndType(e.target.value as 'count')}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="adv-endTypeCount" className="cursor-pointer flex-1">
                      {t('booking:numberOfOccurrences')}
                    </Label>
                    {endType === 'count' && (
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={occurrenceCount}
                        onChange={(e) => setOccurrenceCount(Number(e.target.value))}
                        required={isRepeat && endType === 'count'}
                        className="flex-1"
                        aria-label={t('booking:numberOfOccurrences')}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? t('booking:booking') : t('booking:book')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
