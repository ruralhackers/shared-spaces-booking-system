import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e'
]

interface ColorPickerProps {
  value: string | null
  onChange: (color: string | null) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const { t } = useTranslation(['common', 'admin'])

  function handleSwatchClick(color: string) {
    onChange(value === color ? null : color)
  }

  return (
    <div className="space-y-3">
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="grid grid-cols-4 gap-2" style={{ width: 'fit-content' }}>
        {/* No color swatch */}
        <button
          type="button"
          title={t('admin:noColor')}
          aria-label={t('admin:noColor')}
          onClick={() => onChange(null)}
          className={cn(
            'w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground hover:border-foreground transition-colors',
            value === null && 'ring-2 ring-offset-2 ring-foreground'
          )}
        >
          <span className="text-xs leading-none">✕</span>
        </button>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            aria-label={color}
            onClick={() => handleSwatchClick(color)}
            className={cn(
              'w-7 h-7 rounded-full transition-all',
              value === color && 'ring-2 ring-offset-2 ring-foreground'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={t('admin:colorPlaceholder')}
        className="h-7 w-32 text-xs px-2"
      />
    </div>
  )
}
