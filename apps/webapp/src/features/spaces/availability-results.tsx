import { Link } from '@tanstack/react-router'
import { Check, User } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RouterOutputs } from '@/trpc/react'
import { readStoredBookerName, writeStoredBookerName } from './booker-name-storage'

type SpaceAvailability = RouterOutputs['spaces']['availability'][number]

interface AvailabilityResultsProps {
  results: SpaceAvailability[]
  onBook: (spaceSlug: string, bookerName: string) => void
  isBooking?: boolean
}

export function AvailabilityResults({
  results,
  onBook,
  isBooking = false
}: AvailabilityResultsProps) {
  const { t } = useTranslation()
  const [bookingSpace, setBookingSpace] = useState<string | null>(null)
  const [bookerName, setBookerName] = useState('')

  function handleBookClick(spaceSlug: string) {
    setBookingSpace(spaceSlug)
    setBookerName(readStoredBookerName())
  }

  function handleBookSubmit(e: React.FormEvent, spaceSlug: string) {
    e.preventDefault()
    if (!bookerName.trim()) return
    writeStoredBookerName(bookerName)
    onBook(spaceSlug, bookerName)
    setBookingSpace(null)
    setBookerName('')
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">{t('spaces:noSpacesAvailable')}</div>
    )
  }

  return (
    <div className="space-y-3">
      {results.map((space) => (
        <div
          key={space.spaceSlug}
          className={
            space.color
              ? 'flex items-center justify-between p-4 rounded-lg border-transparent'
              : 'flex items-center justify-between p-4 border rounded-lg bg-card'
          }
          style={space.color ? { backgroundColor: space.color } : undefined}
        >
          <div className="flex items-center gap-3">
            {space.status === 'available' ? (
              <Check
                className={space.color ? 'h-5 w-5 text-white' : 'h-5 w-5 text-green-600'}
                aria-label={t('spaces:available')}
              />
            ) : (
              <User
                className={space.color ? 'h-5 w-5 text-white/70' : 'h-5 w-5 text-muted-foreground'}
                aria-label={t('spaces:occupied')}
              />
            )}
            <div>
              <Link
                to="/spaces/$slug"
                params={{ slug: space.spaceSlug }}
                className={
                  space.color
                    ? 'font-medium text-white hover:underline'
                    : 'font-medium hover:underline'
                }
              >
                {space.spaceName}
              </Link>
              {space.status === 'occupied' && space.occupiedBy && (
                <p
                  className={
                    space.color ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'
                  }
                >
                  {t('spaces:occupiedBy', { name: space.occupiedBy })}
                </p>
              )}
              {space.status === 'occupied' && !space.occupiedBy && (
                <p
                  className={
                    space.color ? 'text-sm text-white/80' : 'text-sm text-muted-foreground'
                  }
                >
                  {t('common:closed')}
                </p>
              )}
            </div>
          </div>

          {space.status === 'available' && (
            <div>
              {bookingSpace === space.spaceSlug ? (
                <form
                  onSubmit={(e) => handleBookSubmit(e, space.spaceSlug)}
                  className="flex items-center gap-2"
                >
                  <div>
                    <Label htmlFor={`name-${space.spaceSlug}`} className="sr-only">
                      {t('booking:name')}
                    </Label>
                    <Input
                      id={`name-${space.spaceSlug}`}
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      placeholder={t('booking:namePlaceholder')}
                      required
                      className="w-48"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={isBooking}>
                    {isBooking ? t('booking:booking') : t('booking:book')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookingSpace(null)}
                  >
                    {t('common:cancel')}
                  </Button>
                </form>
              ) : (
                <Button onClick={() => handleBookClick(space.spaceSlug)} size="sm">
                  {t('booking:book')}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
