import type { SpaceAvailabilityDto } from '@dfs/spaces/domain/space-availability.vo'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface AvailabilityResultsListProps {
  results: SpaceAvailabilityDto[]
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  onReserve: (space: { id: string; slug: string; name: string }) => void
  onViewDay: (spaceSlug: string, date: string) => void
  chosenDate: string
  chosenStart: string
  chosenEnd: string
}

function ResultSkeleton() {
  return (
    <div
      className="flex items-center justify-between rounded-lg border p-3 animate-pulse"
      data-testid="result-skeleton"
    >
      <div className="space-y-1">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="h-8 w-20 rounded bg-muted" />
    </div>
  )
}

function SpaceResultRow({
  result,
  onReserve,
  onViewDay,
  chosenDate
}: {
  result: SpaceAvailabilityDto
  onReserve: AvailabilityResultsListProps['onReserve']
  onViewDay: AvailabilityResultsListProps['onViewDay']
  chosenDate: string
}) {
  const { t } = useTranslation('spaces')

  if (result.state === 'free') {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-bold" aria-hidden>
            ✓
          </span>
          <span className="font-medium">{result.spaceName}</span>
        </div>
        <Button
          size="sm"
          onClick={() =>
            onReserve({ id: result.spaceSlug, slug: result.spaceSlug, name: result.spaceName })
          }
        >
          {t('reserve')}
        </Button>
      </div>
    )
  }

  if (result.state === 'occupied') {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold" aria-hidden>
            ✗
          </span>
          <span className="font-medium">{result.spaceName}</span>
          {result.occupiedBy && (
            <span className="text-muted-foreground text-sm">({result.occupiedBy})</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => onViewDay(result.spaceSlug, chosenDate)}>
          {t('viewDay')}
        </Button>
      </div>
    )
  }

  // closed
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 opacity-50">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-bold" aria-hidden>
          —
        </span>
        <span className="font-medium">{result.spaceName}</span>
      </div>
      <span className="text-sm text-muted-foreground" data-testid="closed-label">
        {t('common:closed')}
      </span>
    </div>
  )
}

export function AvailabilityResultsList({
  results,
  isLoading,
  error,
  onRetry,
  onReserve,
  onViewDay,
  chosenDate,
  chosenStart,
  chosenEnd
}: AvailabilityResultsListProps) {
  const { t } = useTranslation('spaces')

  if (isLoading) {
    return (
      <div className="space-y-2">
        <ResultSkeleton />
        <ResultSkeleton />
        <ResultSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2"
        data-testid="error-state"
      >
        <p className="text-sm text-destructive">{t('couldNotLoadAvailability')}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  const freeCount = results.filter((r) => r.state === 'free').length
  const hasAvailable = freeCount > 0

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {t('forTimeWindow', { start: chosenStart, end: chosenEnd })}
      </p>

      {!hasAvailable && results.length > 0 && (
        <div
          className="rounded-lg border p-4 text-sm text-muted-foreground"
          data-testid="empty-state"
        >
          {t('noSpacesAvailableExtended')}
        </div>
      )}

      {results.map((result) => (
        <SpaceResultRow
          key={result.spaceSlug}
          result={result}
          onReserve={onReserve}
          onViewDay={onViewDay}
          chosenDate={chosenDate}
        />
      ))}
    </div>
  )
}
