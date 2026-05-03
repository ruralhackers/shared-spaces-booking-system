import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enAdmin from '@/locales/en/admin.json'
import enBooking from '@/locales/en/booking.json'
import enCommon from '@/locales/en/common.json'
import enSpaces from '@/locales/en/spaces.json'
import esAdmin from '@/locales/es/admin.json'
import esBooking from '@/locales/es/booking.json'
import esCommon from '@/locales/es/common.json'
import esSpaces from '@/locales/es/spaces.json'
import glAdmin from '@/locales/gl/admin.json'
import glBooking from '@/locales/gl/booking.json'
import glCommon from '@/locales/gl/common.json'
import glSpaces from '@/locales/gl/spaces.json'

export const supportedLanguages = ['es', 'gl', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageLabels: Record<SupportedLanguage, string> = {
  es: 'Español',
  gl: 'Galego',
  en: 'English'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, booking: enBooking, admin: enAdmin, spaces: enSpaces },
      es: { common: esCommon, booking: esBooking, admin: esAdmin, spaces: esSpaces },
      gl: { common: glCommon, booking: glBooking, admin: glAdmin, spaces: glSpaces }
    },
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'booking', 'admin', 'spaces'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    }
  })

export default i18n
