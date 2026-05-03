import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { api } from '@/trpc/react'

export const Route = createRootRoute({
  component: RootComponent
})

function ThemeToggle() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setDark((d) => !d)}
      aria-label={t('toggleTheme')}
      className="min-h-[44px] min-w-[44px] p-0"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function SiteBrand() {
  const { t } = useTranslation()
  const { data, error } = api.config.siteInfo.useQuery(undefined, { staleTime: Infinity })

  // Sync document title with configured site name
  useDocumentTitle(data?.name)

  if (error) {
    return (
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity"
      >
        <span>{t('sharedSpaces')}</span>
      </Link>
    )
  }

  return (
    <Link
      to="/"
      className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity"
    >
      {data?.logoUrl && <img src={data.logoUrl} alt="" className="h-6 w-6 object-contain" />}
      <span>{data?.name ?? t('sharedSpaces')}</span>
    </Link>
  )
}

function RootComponent() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <SiteBrand />
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
