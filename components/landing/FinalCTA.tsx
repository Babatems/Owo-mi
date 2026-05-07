import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function FinalCTA() {
  const t = await getTranslations('finalCta')

  return (
    <section className="py-20 sm:py-28" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div
          className="reveal-on-scroll overflow-hidden rounded-3xl p-12 sm:p-16"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          <p className="mb-4 text-sm font-semibold tracking-wider text-emerald-200 uppercase">
            🍁 Built in Canada
          </p>
          <h2
            id="final-cta-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-emerald-100">
            {t('subheadline')}
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold transition-all hover:bg-emerald-50 active:scale-[0.98]"
            style={{ color: 'var(--brand)' }}
          >
            {t('cta')}
          </Link>
          <p className="mt-4 text-sm text-emerald-200/70">
            No credit card · Read-only · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
