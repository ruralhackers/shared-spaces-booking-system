import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { setAdminKey } from '@/trpc/react'

export const Route = createFileRoute('/admin')({
  validateSearch: (search: Record<string, unknown>) => ({
    key: (search.key as string) ?? ''
  }),
  beforeLoad: ({ search }) => {
    if (!search.key) {
      toast.error('Admin access denied')
      throw redirect({ to: '/' })
    }
    setAdminKey(search.key)
  },
  component: AdminLayout
})

function AdminLayout() {
  const { t } = useTranslation(['common', 'admin'])
  const { key } = Route.useSearch()

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-4">{t('admin:title')}</h1>
        <nav className="flex gap-4 border-b">
          <Link
            to="/admin"
            search={{ key }}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors [&.active]:border-foreground [&.active]:text-foreground text-muted-foreground border-transparent hover:text-foreground"
            activeOptions={{ exact: true }}
          >
            {t('admin:bookingsTab')}
          </Link>
          <Link
            to="/admin/spaces"
            search={{ key }}
            className="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors [&.active]:border-foreground [&.active]:text-foreground text-muted-foreground border-transparent hover:text-foreground"
          >
            {t('admin:spacesTab')}
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
