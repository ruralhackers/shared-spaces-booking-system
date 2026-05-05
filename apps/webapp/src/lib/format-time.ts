import type { Locale } from 'date-fns'
import { format } from 'date-fns'
import { enUS, es, gl } from 'date-fns/locale'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { env } from '@/env'
import type { SupportedLanguage } from '@/lib/i18n'

const TZ = env.VITE_BOOKING_TZ

const dateFnsLocales: Record<SupportedLanguage, Locale> = {
  es,
  gl,
  en: enUS
}

export function getDateLocale(lang: string): Locale {
  return dateFnsLocales[lang as SupportedLanguage] ?? es
}

export function formatTime(isoString: string): string {
  const zoned = toZonedTime(new Date(isoString), TZ)
  return format(zoned, 'HH:mm')
}

export function formatDateTime(isoString: string, lang?: string): string {
  const zoned = toZonedTime(new Date(isoString), TZ)
  const locale = lang ? getDateLocale(lang) : es
  return format(zoned, 'MMM d, HH:mm', { locale })
}

export function todayInBookingTz(): string {
  return formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')
}

export function bookingTz(): string {
  return TZ
}

export { formatInTimeZone }
