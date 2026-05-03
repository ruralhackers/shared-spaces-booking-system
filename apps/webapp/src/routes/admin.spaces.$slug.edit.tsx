import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ColorPicker } from '@/features/spaces/color-picker'
import type { OpenHours } from '@/features/spaces/open-hours-editor'
import { OpenHoursEditor } from '@/features/spaces/open-hours-editor'
import { api } from '@/trpc/react'

export const Route = createFileRoute('/admin/spaces/$slug/edit')({
  validateSearch: (search: Record<string, unknown>) => ({
    key: (search.key as string) ?? ''
  }),
  component: EditSpacePage
})

function EditSpacePage() {
  const { t } = useTranslation(['common', 'admin'])
  const { slug } = Route.useParams()
  const { key } = Route.useSearch()
  const navigate = useNavigate()
  const utils = api.useUtils()

  const today = new Date().toISOString().slice(0, 10)
  const { data: dayView, isLoading } = api.spaces.dayView.useQuery({ slug, date: today })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [openHours, setOpenHours] = useState<OpenHours | null>(null)
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    if (dayView?.space?.openHours) {
      setName(dayView.space.displayName)
      setDescription(dayView.space.description)
      setOpenHours(dayView.space.openHours as OpenHours)
      setColor(dayView.space.color ?? null)
    }
  }, [dayView])

  const updateMutation = api.spaces.update.useMutation({
    onSuccess: () => {
      utils.spaces.list.invalidate()
      utils.spaces.dayView.invalidate({ slug })
      toast.success(t('admin:spaceUpdated'))
      navigate({ to: '/admin/spaces', search: { key } })
    },
    onError: (e) => toast.error(e.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!openHours) return
    updateMutation.mutate({ slug, name, description, openHours, color })
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
      </div>
    )
  }

  if (!dayView) {
    return <p className="text-sm text-muted-foreground">{t('admin:spaceNotFound')}</p>
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-1">{t('admin:editSpace')}</h2>
      <p
        className="text-xs text-muted-foreground mb-6"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: translation contains safe HTML
        dangerouslySetInnerHTML={{ __html: t('admin:slugLabel', { slug }) }}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t('admin:spaceName')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('admin:description')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        {openHours && (
          <div className="space-y-2">
            <Label>{t('admin:openHours')}</Label>
            <OpenHoursEditor value={openHours} onChange={setOpenHours} />
          </div>
        )}
        <div className="space-y-2">
          <Label>{t('admin:color')}</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('admin:saving') : t('admin:saveChanges')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/admin/spaces', search: { key } })}
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </>
  )
}
