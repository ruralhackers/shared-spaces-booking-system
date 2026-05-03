import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// Set timezone for tests
process.env.VITE_BOOKING_TZ = 'America/Argentina/Buenos_Aires'

// Initialize i18n for tests with English as default
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAdmin from '@/locales/en/admin.json'
import enBooking from '@/locales/en/booking.json'
import enCommon from '@/locales/en/common.json'
import enSpaces from '@/locales/en/spaces.json'

await i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, booking: enBooking, admin: enAdmin, spaces: enSpaces }
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'booking', 'admin', 'spaces'],
  interpolation: { escapeValue: false }
})
