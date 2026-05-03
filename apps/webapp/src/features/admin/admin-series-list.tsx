import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface BookingSeries {
  id: string
  bookerName: string
  spaceSlug: string
  frequency: string
  startTime: string
  endTime: string
  firstDate: string
  endDate: string
}

interface AdminSeriesListProps {
  series: BookingSeries[]
  onCancel: (seriesId: string) => void
  isPending: boolean
}

export function AdminSeriesList({ series, onCancel, isPending }: AdminSeriesListProps) {
  const { t } = useTranslation(['common', 'booking'])

  if (series.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('booking:noActiveSeries')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4 text-sm font-medium">{t('booking:bookerName')}</th>
            <th className="text-left py-2 px-4 text-sm font-medium">{t('space')}</th>
            <th className="text-left py-2 px-4 text-sm font-medium">{t('booking:frequency')}</th>
            <th className="text-left py-2 px-4 text-sm font-medium">{t('booking:time')}</th>
            <th className="text-left py-2 px-4 text-sm font-medium">{t('booking:firstDate')}</th>
            <th className="text-left py-2 px-4 text-sm font-medium">{t('booking:endDate')}</th>
            <th className="text-right py-2 px-4 text-sm font-medium">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2 px-4 text-sm">{s.bookerName}</td>
              <td className="py-2 px-4 text-sm">{s.spaceSlug}</td>
              <td className="py-2 px-4 text-sm">{s.frequency}</td>
              <td className="py-2 px-4 text-sm">
                {s.startTime} – {s.endTime}
              </td>
              <td className="py-2 px-4 text-sm">{new Date(s.firstDate).toLocaleDateString()}</td>
              <td className="py-2 px-4 text-sm">{new Date(s.endDate).toLocaleDateString()}</td>
              <td className="py-2 px-4 text-sm text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onCancel(s.id)}
                  disabled={isPending}
                >
                  {t('booking:cancelSeries')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
