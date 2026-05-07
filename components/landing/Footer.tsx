import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'

export async function LandingFooter() {
  const locale = await getLocale()
  const t = await getTranslations('footer')
  const altLocale = locale === 'en' ? 'fr' : 'en'
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="border-t border-neutral-200/60 dark:border-neutral-800/60"
      aria-label="Footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-base font-semibold tracking-tight text-[var(--brand)]">✦</span>
              <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                Owo-mi
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t('tagline')}
            </p>
            <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">🍁 {t('builtIn')}</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              {t('product')}
            </h3>
            <ul className="space-y-2">
              {(['dashboard', 'pricing', 'security'] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={key === 'dashboard' ? '/dashboard' : `/${locale}#${key}`}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {t(`links.${key}` as Parameters<typeof t>[0])}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              {t('company')}
            </h3>
            <ul className="space-y-2">
              {(['about', 'blog'] as const).map((key) => (
                <li key={key}>
                  <span className="cursor-not-allowed text-sm text-neutral-400 dark:text-neutral-600">
                    {t(`links.${key}` as Parameters<typeof t>[0])}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              {t('legal')}
            </h3>
            <ul className="space-y-2">
              {(['privacy', 'terms', 'accessibility', 'pipeda'] as const).map((key) => (
                <li key={key}>
                  <span className="cursor-not-allowed text-sm text-neutral-400 dark:text-neutral-600">
                    {t(`links.${key}` as Parameters<typeof t>[0])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compliance notice */}
        <div className="mt-10 rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('compliance')}
          </p>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-200/60 pt-8 sm:flex-row dark:border-neutral-800/60">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {t('copyright').replace('2026', currentYear.toString())}
          </p>
          <Link
            href={`/${altLocale}`}
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {t('switchLocale')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
