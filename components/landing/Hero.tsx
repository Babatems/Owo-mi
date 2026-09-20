import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
      aria-labelledby="hero-heading"
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/images/landing_page/hero-section-currency-face-stack.avif"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.16] grayscale-[45%] dark:opacity-[0.08] dark:grayscale"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--marketing-bg)_0%,transparent_35%,var(--marketing-bg)_100%)] dark:bg-[linear-gradient(to_bottom,var(--marketing-bg-dark)_0%,transparent_35%,var(--marketing-bg-dark)_100%)]" />
      </div>

      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--brand) 40%, transparent), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            color: 'var(--brand)',
            backgroundColor: 'var(--brand-light)',
            borderColor: 'color-mix(in srgb, var(--brand) 20%, transparent)',
          }}
        >
          <span aria-hidden="true">🍁</span>
          <span>Built in Canada</span>
        </div>

        <h1
          id="hero-heading"
          className="text-4xl leading-[1.1] font-bold tracking-tight text-[var(--navy)] sm:text-5xl lg:text-[3.5rem] dark:text-white"
        >
          {t('headline')}
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t('subheadline')}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="w-full rounded-xl px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] sm:w-auto"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {t('ctaPrimary')}
          </Link>
          <a
            href="#features"
            className="w-full rounded-xl border border-neutral-200 bg-white/60 px-6 py-3.5 text-center text-base font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-white sm:w-auto dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t('ctaSecondary')} →
          </a>
        </div>

        <p className="mt-4 text-sm text-neutral-400 dark:text-neutral-500">{t('trustLine')}</p>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/60 bg-[var(--marketing-bg)]/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden dark:border-neutral-800/60 dark:bg-[var(--marketing-bg-dark)]/95">
        <Link
          href="/sign-up"
          className="block w-full rounded-xl py-3.5 text-center text-base font-semibold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {t('ctaPrimary')}
        </Link>
      </div>
    </section>
  )
}
