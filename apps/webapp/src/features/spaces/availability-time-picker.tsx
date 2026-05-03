import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface AvailabilityTimePickerProps {
  defaultStart: string
  defaultEnd: string
  date: string
  onSubmit: (start: string, end: string) => void
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

function validateWindow(start: string, end: string, date: string): string | null {
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)

  if (endMin <= startMin) {
    return 'endMustBeAfterStart'
  }

  if (endMin - startMin < 30) {
    return 'minimumDuration30min'
  }

  const now = new Date()
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const [sh, sm] = start.split(':').map(Number) as [number, number]
  const chosen = new Date(year, month - 1, day, sh, sm, 0)
  if (chosen < now) {
    return 'cannotBookInPast'
  }

  return null
}

export function AvailabilityTimePicker({
  defaultStart,
  defaultEnd,
  date,
  onSubmit
}: AvailabilityTimePickerProps) {
  const { t } = useTranslation('spaces')
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [error, setError] = useState<string | null>(null)

  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  const diffMin = endMin > startMin ? endMin - startMin : 0
  const durationH = Math.floor(diffMin / 60)
  const durationM = diffMin % 60

  function handleSubmit() {
    const err = validateWindow(start, end, date)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onSubmit(start, end)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label htmlFor="time-start">{t('from')}</Label>
          <input
            id="time-start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="time-end">{t('until')}</Label>
          <input
            id="time-end"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" data-testid="duration-label">
        {t('duration')}: {durationH}h {durationM}min
      </p>

      {error && (
        <p className="text-sm text-destructive" data-testid="validation-error">
          {t(error)}
        </p>
      )}

      <Button onClick={handleSubmit}>{t('searchAvailability')}</Button>
    </div>
  )
}
