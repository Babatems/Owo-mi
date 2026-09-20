import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { LOCALE_COOKIE_NAME, isAppLocale } from '@/lib/i18n/locale'

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale comes from the `[locale]` URL segment (marketing pages).
  // Routes outside that segment (auth, dashboard) have no segment to derive
  // it from, so fall back to the cookie set when the user last switched.
  let locale = await requestLocale

  if (!isAppLocale(locale)) {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value
    locale = isAppLocale(cookieLocale) ? cookieLocale : routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
