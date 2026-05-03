import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AdminSeriesList } from '@/features/admin/admin-series-list'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/admin/series')({
  component: AdminSeriesPage
})

function AdminSeriesPage() {
  const { t } = useTranslation(['common', 'booking'])
  const utils = api.useUtils()
  const { data, isLoading, error } = api.spaces.adminBookingSeries.list.useQuery()

  const cancelMutation = api.spaces.adminBookingSeries.cancel.useMutation({
    onSuccess: () => {
      utils.spaces.adminBookingSeries.list.invalidate()
      toast.success(t('booking:bookingCancelled'))
    },
    onError: (e) => toast.error(e.message)
  })

  function handleCancel(seriesId: string) {
    cancelMutation.mutate({ seriesId, scope: 'thisAndFuture' })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">{t('booking:activeSeries')}</h1>

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {data && (
        <AdminSeriesList
          series={data}
          onCancel={handleCancel}
          isPending={cancelMutation.isPending}
        />
      )}
    </div>
  )
}
