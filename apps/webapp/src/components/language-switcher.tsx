import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { languageLabels, type SupportedLanguage, supportedLanguages } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language as SupportedLanguage

  function cycleLanguage() {
    const idx = supportedLanguages.indexOf(current)
    const next = supportedLanguages[(idx + 1) % supportedLanguages.length] as SupportedLanguage
    void i18n.changeLanguage(next)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleLanguage}
      className="h-8 px-2 text-xs font-medium"
      title={languageLabels[current]}
    >
      {current.toUpperCase()}
    </Button>
  )
}
