import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface OpenHoursWindow {
  start: string
  end: string
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type OpenHours = Record<DayKey, OpenHoursWindow[]>

const DAY_TRANSLATION_KEYS: Record<DayKey, string> = {
  mon: 'spaces:monday',
  tue: 'spaces:tuesday',
  wed: 'spaces:wednesday',
  thu: 'spaces:thursday',
  fri: 'spaces:friday',
  sat: 'spaces:saturday',
  sun: 'spaces:sunday'
}

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const HHMM_RE = /^(?:[01]\d|2[0-4]):[0-5]\d$/

function parseMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number)
  return h * 60 + m
}

interface DaySectionProps {
  day: DayKey
  windows: OpenHoursWindow[]
  onChange: (windows: OpenHoursWindow[]) => void
}

function DaySection({ day, windows, onChange }: DaySectionProps) {
  const { t } = useTranslation(['common', 'spaces'])
  const dayLabel = t(DAY_TRANSLATION_KEYS[day]) as string
  const is24h = windows.length === 1 && windows[0]?.start === '00:00' && windows[0]?.end === '24:00'

  function validateWindows(ws: OpenHoursWindow[]): string | null {
    for (const w of ws) {
      if (!HHMM_RE.test(w.start) || !HHMM_RE.test(w.end)) {
        return t('spaces:invalidTimeFormat')
      }
      if (parseMinutes(w.end) <= parseMinutes(w.start)) {
        return t('spaces:endAfterStart')
      }
    }
    const sorted = [...ws].sort((a, b) => parseMinutes(a.start) - parseMinutes(b.start))
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1] as OpenHoursWindow
      const curr = sorted[i] as OpenHoursWindow
      if (parseMinutes(curr.start) < parseMinutes(prev.end)) {
        return t('spaces:windowsOverlap', {
          a: `${prev.start}–${prev.end}`,
          b: `${curr.start}–${curr.end}`
        })
      }
    }
    return null
  }

  const error = validateWindows(windows)

  const toggle24h = () => {
    if (is24h) {
      onChange([])
    } else {
      onChange([{ start: '00:00', end: '24:00' }])
    }
  }

  const addWindow = () => {
    onChange([...windows, { start: '09:00', end: '18:00' }])
  }

  const removeWindow = (i: number) => {
    onChange(windows.filter((_, idx) => idx !== i))
  }

  const updateWindow = (i: number, field: 'start' | 'end', value: string) => {
    onChange(windows.map((w, idx) => (idx === i ? { ...w, [field]: value } : w)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{dayLabel}</Label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer min-h-[44px] py-2">
          <input
            type="checkbox"
            checked={is24h}
            onChange={toggle24h}
            className="h-5 w-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          />
          {t('spaces:open24h')}
        </label>
      </div>

      {!is24h && (
        <div className="space-y-1.5 pl-2">
          {windows.map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: windows have no stable id
            <div key={i} className="flex items-center gap-2">
              <Input
                type="text"
                value={w.start}
                onChange={(e) => updateWindow(i, 'start', e.target.value)}
                placeholder="09:00"
                className="h-9 w-20 text-xs font-mono"
                aria-label={t('spaces:windowStart', { day: dayLabel, n: i + 1 })}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="text"
                value={w.end}
                onChange={(e) => updateWindow(i, 'end', e.target.value)}
                placeholder="18:00"
                className="h-9 w-20 text-xs font-mono"
                aria-label={t('spaces:windowEnd', { day: dayLabel, n: i + 1 })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeWindow(i)}
                aria-label={t('spaces:removeWindow', { n: i + 1 })}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={addWindow}
          >
            {t('spaces:addWindow')}
          </Button>
          {windows.length === 0 && (
            <p className="text-xs text-muted-foreground">{t('common:closed')}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive pl-2">{error}</p>}
    </div>
  )
}

interface OpenHoursEditorProps {
  value: OpenHours
  onChange: (value: OpenHours) => void
}

export function OpenHoursEditor({ value, onChange }: OpenHoursEditorProps) {
  const updateDay = (day: DayKey, windows: OpenHoursWindow[]) => {
    onChange({ ...value, [day]: windows })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      {DAY_KEYS.map((day) => (
        <DaySection
          key={day}
          day={day}
          windows={value[day]}
          onChange={(windows) => updateDay(day, windows)}
        />
      ))}
    </div>
  )
}
