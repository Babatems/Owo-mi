import { routing } from '@/i18n/routing'

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type AppLocale = (typeof routing.locales)[number]

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (routing.locales as readonly string[]).includes(value)
}

/**
 * Persists the chosen locale client-side so subsequent requests to
 * unprefixed routes (auth pages, dashboard) render in the same language.
 * Must be called from a client component.
 */
export function persistLocaleCookie(locale: AppLocale) {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
}
