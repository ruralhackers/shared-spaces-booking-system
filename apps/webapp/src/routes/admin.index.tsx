import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AdminCancelDialog } from '@/features/spaces/admin-cancel-dialog'
import { formatDateTime } from '@/lib/format-time'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/admin/')({
  component: AdminPage
})

function AdminPage() {
  const { t, i18n } = useTranslation(['common', 'admin'])
  const utils = api.useUtils()
  const { data: bookings, isLoading, error } = api.spaces.adminList.useQuery()

  const cancelMutation = api.spaces.adminCancel.useMutation({
    onSuccess: () => {
      utils.spaces.adminList.invalidate()
      toast.success(t('admin:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  const [cancellingId, setCancellingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error.message.includes('UNAUTHORIZED') ? t('admin:accessDenied') : error.message}
      </div>
    )
  }

  // Group bookings by space
  const bySpace = (bookings ?? []).reduce<Record<string, typeof bookings>>((acc, b) => {
    const key = b.spaceDisplayName
    if (!acc[key]) acc[key] = []
    acc[key]?.push(b)
    return acc
  }, {})

  const spaceNames = Object.keys(bySpace).sort()

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{t('admin:activeBookings')}</p>
        {bookings && bookings.length > 0 && (
          <Badge variant="secondary">{t('admin:activeCount', { count: bookings.length })}</Badge>
        )}
      </div>

      {bookings?.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t('admin:noActiveBookings')}
        </p>
      )}

      <div className="flex flex-col gap-8">
        {spaceNames.map((spaceName, i) => (
          <div key={spaceName}>
            {i > 0 && <Separator className="mb-8" />}
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {spaceName}
            </h2>
            <ul className="flex flex-col divide-y">
              {bySpace[spaceName]?.map((b) => (
                <li
                  key={b.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium block">{b.bookerName}</span>
                    <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">
                      {formatDateTime(b.startsAt, i18n.language)} –{' '}
                      {formatDateTime(b.endsAt, i18n.language)}
                    </span>
                  </div>
                  <AdminCancelDialog
                    bookerName={b.bookerName}
                    isPending={cancelMutation.isPending && cancellingId === b.id}
                    onConfirm={() => {
                      setCancellingId(b.id)
                      cancelMutation.mutate({ id: b.id })
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}
