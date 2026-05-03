import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
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

const DEFAULT_OPEN_HOURS: OpenHours = {
  mon: [{ start: '00:00', end: '24:00' }],
  tue: [{ start: '00:00', end: '24:00' }],
  wed: [{ start: '00:00', end: '24:00' }],
  thu: [{ start: '00:00', end: '24:00' }],
  fri: [{ start: '00:00', end: '24:00' }],
  sat: [{ start: '00:00', end: '24:00' }],
  sun: [{ start: '00:00', end: '24:00' }]
}

export const Route = createFileRoute('/admin/spaces/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    key: (search.key as string) ?? ''
  }),
  component: NewSpacePage
})

function NewSpacePage() {
  const { t } = useTranslation(['common', 'admin'])
  const navigate = useNavigate()
  const { key } = Route.useSearch()
  const utils = api.useUtils()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [openHours, setOpenHours] = useState<OpenHours>(DEFAULT_OPEN_HOURS)
  const [color, setColor] = useState<string | null>(null)

  const createMutation = api.spaces.create.useMutation({
    onSuccess: () => {
      utils.spaces.list.invalidate()
      toast.success(t('admin:spaceCreated'))
      navigate({ to: '/admin/spaces', search: { key } })
    },
    onError: (e) => toast.error(e.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ name, description, openHours, color })
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-6">{t('admin:createSpace')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{t('admin:spaceName')}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('admin:spaceNamePlaceholder')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('admin:description')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('admin:descriptionPlaceholder')}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('admin:openHours')}</Label>
          <OpenHoursEditor value={openHours} onChange={setOpenHours} />
        </div>
        <div className="space-y-2">
          <Label>{t('admin:color')}</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('admin:creating') : t('admin:createSpace')}
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
