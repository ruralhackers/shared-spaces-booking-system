import 'i18next'

import type enAdmin from '@/locales/en/admin.json'
import type enBooking from '@/locales/en/booking.json'
import type enCommon from '@/locales/en/common.json'
import type enSpaces from '@/locales/en/spaces.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof enCommon
      booking: typeof enBooking
      admin: typeof enAdmin
      spaces: typeof enSpaces
    }
  }
}
