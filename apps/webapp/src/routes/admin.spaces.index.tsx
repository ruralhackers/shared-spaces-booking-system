import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/admin/spaces/')({
  validateSearch: (search: Record<string, unknown>) => ({
    key: (search.key as string) ?? ''
  }),
  component: AdminSpacesPage
})

function AdminSpacesPage() {
  const { t } = useTranslation(['common', 'admin'])
  const { key } = Route.useSearch()
  const utils = api.useUtils()
  const { data: spaces, isLoading } = api.spaces.list.useQuery()

  const deleteMutation = api.spaces.delete.useMutation({
    onSuccess: () => {
      utils.spaces.list.invalidate()
      toast.success(t('admin:spaceDeleted'))
    },
    onError: (e) => {
      toast.error(e.message)
    }
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{t('admin:manageSpaces')}</p>
        <Button asChild size="sm">
          <Link to="/admin/spaces/new" search={{ key }}>
            {t('admin:createSpace')}
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 rounded bg-muted" />
          <div className="h-12 rounded bg-muted" />
        </div>
      )}

      {!isLoading && spaces?.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('admin:noSpaces')}</p>
      )}

      {spaces && spaces.length > 0 && (
        <ul className="flex flex-col divide-y border rounded-lg overflow-hidden">
          {spaces.map((space) => (
            <li
              key={space.id}
              className="flex items-center justify-between gap-4 px-4 py-3 bg-card"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{space.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{space.slug}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/admin/spaces/$slug/edit"
                    params={{ slug: space.slug }}
                    search={{ key }}
                  >
                    {t('edit')}
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:border-destructive/50"
                      aria-label={t('admin:deleteSpaceLabel', { name: space.displayName })}
                    >
                      {t('delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('admin:deleteSpace')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('admin:deleteSpaceConfirm', { name: space.displayName })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteMutation.mutate({ slug: space.slug })}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? t('admin:deleting') : t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
