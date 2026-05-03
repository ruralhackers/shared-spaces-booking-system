import type { SpaceDto } from '@dfs/spaces/application/dtos'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { writeStoredBookerName } from '@/features/spaces/booker-name-storage'
import { QuickBookSheet } from '@/features/spaces/quick-book-sheet'
import { SpaceCard } from '@/features/spaces/space-card'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/')({
  component: HomePage
})

function SpaceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse" data-testid="space-card-skeleton">
      <div className="h-4 w-28 rounded bg-muted mb-3" />
      <div className="h-3 w-44 rounded bg-muted" />
    </div>
  )
}

interface SheetState {
  space: SpaceDto
  duration: number
}

export function HomePage() {
  const { t } = useTranslation(['common', 'spaces', 'booking'])
  const navigate = useNavigate()
  const { data: spaces, isLoading, error } = api.spaces.list.useQuery()
  const utils = api.useUtils()

  const [sheetState, setSheetState] = useState<SheetState | null>(null)

  const bookMutation = api.spaces.book.useMutation({
    onSuccess: () => {
      toast.success(t('booking:bookingConfirmed'))
      setSheetState(null)
      void utils.spaces.list.invalidate()
    },
    onError: (e) => toast.error(e.message)
  })

  function handleQuickBook(space: SpaceDto, duration: number) {
    setSheetState({ space, duration })
  }

  function handleConfirm(name: string, startsAt: Date, endsAt: Date) {
    if (!sheetState) return
    writeStoredBookerName(name)
    bookMutation.mutate({
      slug: sheetState.space.slug,
      bookerName: name,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString()
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t('common:couldNotLoad')}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {isLoading && (
          <>
            <SpaceCardSkeleton />
            <SpaceCardSkeleton />
            <SpaceCardSkeleton />
          </>
        )}

        {spaces?.map((space) => (
          <SpaceCard
            key={space.id}
            space={space}
            onQuickBook={(duration) => handleQuickBook(space, duration)}
            onNavigate={() => navigate({ to: '/spaces/$slug', params: { slug: space.slug } })}
          />
        ))}

        {!isLoading && spaces?.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-medium">{t('spaces:noSpacesYet')}</p>
            <p className="text-sm text-muted-foreground">{t('spaces:createFirstSpace')}</p>
          </div>
        )}
      </div>

      {sheetState && (
        <QuickBookSheet
          open={!!sheetState}
          onOpenChange={(open) => {
            if (!open) setSheetState(null)
          }}
          space={sheetState.space}
          defaultStart={new Date()}
          defaultEnd={new Date(Date.now() + sheetState.duration * 60_000)}
          onConfirm={handleConfirm}
          onCancel={() => setSheetState(null)}
        />
      )}
    </div>
  )
}
