import { Suspense } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { HeroVisual } from './HeroVisual'

function DashboardSkeleton() {
  return (
    <div
      className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900"
      aria-hidden="true"
    >
      <div className="animate-pulse">
        <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-2 h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center py-4">
              <div className="mb-1 size-3.5 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-4 w-14 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-1 h-3 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
        <div className="space-y-3 px-5 pt-3 pb-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-8 shrink-0 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-2.5 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="h-3.5 w-14 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
      aria-labelledby="hero-heading"
    >
      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--brand) 40%, transparent), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text column */}
          <div className="order-2 text-center lg:order-1 lg:text-left">
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

            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-neutral-600 lg:mx-0 dark:text-neutral-300">
              {t('subheadline')}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
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

          {/* Visual column */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <Suspense fallback={<DashboardSkeleton />}>
              <HeroVisual />
            </Suspense>
          </div>
        </div>
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
