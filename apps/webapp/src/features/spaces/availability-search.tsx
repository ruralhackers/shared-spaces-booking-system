import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AvailabilitySearchProps {
  onSearch: (params: { date: string; startsAt: string; endsAt: string }) => void
}

function getCurrentHour(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:00`
}

function getNextHour(): string {
  const now = new Date()
  const nextHour = (now.getHours() + 1) % 24
  return `${String(nextHour).padStart(2, '0')}:00`
}

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AvailabilitySearch({ onSearch }: AvailabilitySearchProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState(getTodayDate())
  const [startTime, setStartTime] = useState(getCurrentHour())
  const [endTime, setEndTime] = useState(getNextHour())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !startTime || !endTime) return
    onSearch({ date, startsAt: startTime, endsAt: endTime })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold">{t('spaces:searchAvailability')}</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search-date">{t('spaces:date')}</Label>
          <Input
            id="search-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>

        <div className="flex-1">
          <Label htmlFor="search-start">{t('spaces:startTime')}</Label>
          <Input
            id="search-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>

        <div className="flex-1">
          <Label htmlFor="search-end">{t('spaces:endTime')}</Label>
          <Input
            id="search-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
      </div>

      <Button type="submit" className="self-start">
        {t('spaces:searchButton')}
      </Button>
    </form>
  )
}
