import type { SpaceDto } from '@dfs/spaces/application/dtos'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/format-time'

interface SpaceCardProps {
  space: SpaceDto
  onQuickBook: (duration: number) => void
  onNavigate: () => void
}

const QUICK_DURATIONS = [
  { label: '30min', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 }
]

export function SpaceCard({ space, onQuickBook, onNavigate }: SpaceCardProps) {
  const { t } = useTranslation(['spaces', 'booking'])
  const { currentStatus } = space
  const hasColor = !!space.color

  function handleCardClick(e: React.MouseEvent) {
    // Only navigate if clicking on the card body, not buttons
    if ((e.target as HTMLElement).closest('button')) return
    onNavigate()
  }

  function renderStatus() {
    if (currentStatus.state === 'free') {
      const time = currentStatus.freeUntil ? formatTime(currentStatus.freeUntil) : null
      return (
        <p className={hasColor ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'}>
          {time ? t('spaces:freeUntil', { time }) : t('spaces:freeAllDay')}
        </p>
      )
    }

    if (currentStatus.state === 'occupied') {
      const time = currentStatus.occupiedUntil ? formatTime(currentStatus.occupiedUntil) : null
      const name = currentStatus.occupiedBy ?? ''
      const nowMs = Date.now()
      const untilMs = currentStatus.occupiedUntil ? new Date(currentStatus.occupiedUntil).getTime() : nowMs
      const minutes = Math.max(0, Math.round((untilMs - nowMs) / 60_000))
      return (
        <p className={hasColor ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'}>
          {t('spaces:occupiedUntil', { name, time: time ?? '', minutes })}
        </p>
      )
    }

    // closed
    const nextOpen = currentStatus.nextOpenAt
    if (nextOpen) {
      return (
        <p className={hasColor ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'}>
          {t('spaces:closedOpensAt', { time: formatTime(nextOpen) })}
        </p>
      )
    }
    return (
      <p className={hasColor ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'}>
        {t('spaces:closedToday')}
      </p>
    )
  }

  function renderActions() {
    if (currentStatus.state === 'free') {
      const freeMinutes = currentStatus.freeWindowMinutes ?? 0
      const visibleButtons = QUICK_DURATIONS.filter((d) => d.minutes <= freeMinutes)
      if (visibleButtons.length === 0) return null
      return (
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          {visibleButtons.map((d) => (
            <Button
              key={d.label}
              size="sm"
              variant={hasColor ? 'secondary' : 'outline'}
              onClick={() => onQuickBook(d.minutes)}
            >
              {d.label}
            </Button>
          ))}
        </div>
      )
    }

    if (currentStatus.state === 'occupied') {
      return (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={hasColor ? 'secondary' : 'outline'}
            onClick={onNavigate}
          >
            {t('spaces:bookLater')} →
          </Button>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className={`rounded-xl border p-5 cursor-pointer transition-all duration-150 ${
        hasColor
          ? 'border-transparent hover:brightness-110'
          : 'hover:bg-accent/40'
      }`}
      style={space.color ? { backgroundColor: space.color } : undefined}
      onClick={handleCardClick}
    >
      <p className={`font-semibold text-base ${hasColor ? 'text-white' : ''}`}>
        {space.displayName}
      </p>
      {renderStatus()}
      {renderActions()}
    </div>
  )
}
