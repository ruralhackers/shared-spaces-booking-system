import { createFileRoute, Link } from '@tanstack/react-router'
import { fromZonedTime } from 'date-fns-tz'
import { ChevronRight, Circle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AvailabilityResults } from '@/features/spaces/availability-results'
import { AvailabilitySearch } from '@/features/spaces/availability-search'
import { bookingTz } from '@/lib/format-time'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/')({
  component: HomePage
})

function SpaceCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 w-28 rounded bg-muted mb-3" />
      <div className="h-3 w-44 rounded bg-muted" />
    </div>
  )
}

function toBookingInstant(date: string, time: string): string {
  return fromZonedTime(`${date}T${time}:00`, bookingTz()).toISOString()
}

function HomePage() {
  const { t } = useTranslation(['common', 'spaces', 'booking'])
  const { data: spaces, isLoading, error } = api.spaces.list.useQuery()
  const [searchParams, setSearchParams] = useState<{
    date: string
    startsAt: string
    endsAt: string
  } | null>(null)

  const availabilityQuery = api.spaces.availability.useQuery(
    {
      startsAt: searchParams ? toBookingInstant(searchParams.date, searchParams.startsAt) : '',
      endsAt: searchParams ? toBookingInstant(searchParams.date, searchParams.endsAt) : ''
    },
    { enabled: !!searchParams }
  )

  const bookMutation = api.spaces.book.useMutation({
    onSuccess: () => {
      toast.success(t('booking:bookingConfirmed'))
      void availabilityQuery.refetch()
    },
    onError: (e) => toast.error(e.message)
  })

  function handleSearch(params: { date: string; startsAt: string; endsAt: string }) {
    setSearchParams(params)
  }

  function handleBook(spaceSlug: string, bookerName: string) {
    if (!searchParams) return
    bookMutation.mutate({
      slug: spaceSlug,
      bookerName,
      startsAt: toBookingInstant(searchParams.date, searchParams.startsAt),
      endsAt: toBookingInstant(searchParams.date, searchParams.endsAt)
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      {/* All Spaces List */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight mb-1">{t('common:spaces')}</h2>
          <p className="text-sm text-muted-foreground">{t('booking:selectSpace')}</p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {t('common:couldNotLoad')}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isLoading && (
            <>
              <SpaceCardSkeleton />
              <SpaceCardSkeleton />
            </>
          )}

          {spaces?.map((space) => (
            <Link
              key={space.id}
              to="/spaces/$slug"
              params={{ slug: space.slug }}
              className="group block"
            >
              <Card
                className={
                  space.color
                    ? 'transition-all duration-150 border-transparent group-hover:brightness-110'
                    : 'transition-colors duration-150 group-hover:bg-accent/40'
                }
                style={space.color ? { backgroundColor: space.color } : undefined}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className={space.color ? 'text-base text-white' : 'text-base'}>
                          {space.displayName}
                        </CardTitle>
                        {space.isOccupiedNow && (
                          <Circle
                            className={
                              space.color
                                ? 'h-2.5 w-2.5 fill-white text-white'
                                : 'h-2.5 w-2.5 fill-destructive text-destructive'
                            }
                            aria-label={t('spaces:occupied')}
                          />
                        )}
                      </div>
                      <CardDescription className={space.color ? 'text-white/80' : 'mt-0.5'}>
                        {space.description}
                      </CardDescription>
                    </div>
                    <ChevronRight
                      className={
                        space.color
                          ? 'h-4 w-4 text-white/70'
                          : 'h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors'
                      }
                    />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {!isLoading && spaces?.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium">{t('spaces:noSpacesYet')}</p>
              <p className="text-sm text-muted-foreground">{t('spaces:createFirstSpace')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Availability Search */}
      <div>
        <AvailabilitySearch onSearch={handleSearch} />
      </div>

      {/* Availability Results */}
      {searchParams && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('spaces:availableSpaces')}</h2>

          {availabilityQuery.isLoading && (
            <div className="text-center py-8 text-muted-foreground">{t('common:loading')}</div>
          )}

          {availabilityQuery.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {availabilityQuery.error.message}
            </div>
          )}

          {availabilityQuery.data && (
            <AvailabilityResults
              results={availabilityQuery.data}
              onBook={handleBook}
              isBooking={bookMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  )
}
