'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'

type Tier = {
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
}

function formatPrice(cents: number, isAnnual: boolean, perMonth: string, perYear: string) {
  if (cents === 0) return { amount: '$0', period: '' }
  if (isAnnual) {
    return { amount: `$${(cents / 100).toFixed(0)}`, period: perYear }
  }
  return { amount: `$${(cents / 100).toFixed(2).replace('.00', '')}`, period: perMonth }
}

export function Pricing() {
  const t = useTranslations('pricing')
  const [annual, setAnnual] = useState(true)

  const tiers = t.raw('tiers') as Tier[]
  const popularIndex = 1

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="pricing"
        className="py-20 sm:py-28"
        aria-labelledby="pricing-heading"
        style={{ scrollMarginTop: '4rem' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'var(--brand)' }}
            >
              {t('sectionLabel')}
            </p>
            <h2
              id="pricing-heading"
              className="text-3xl font-bold tracking-tight text-[var(--navy)] sm:text-4xl dark:text-white"
            >
              {t('headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500 dark:text-neutral-400">
              {t('subheadline')}
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  !annual
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                {t('monthly')}
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  annual
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                {t('annual')}
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {t('saveMonths')}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tiers.map((tier, idx) => {
              const isPopular = idx === popularIndex
              const { amount, period } = formatPrice(
                annual ? tier.annualPrice : tier.monthlyPrice,
                annual,
                t('perMonth'),
                t('perYear')
              )
              const isFree = tier.monthlyPrice === 0

              return (
                <div
                  key={tier.name}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-6 transition-all',
                    isPopular
                      ? 'border-[var(--brand)] bg-white shadow-xl lg:-translate-y-2 dark:bg-neutral-900'
                      : 'border-neutral-200/70 bg-white dark:border-neutral-700/60 dark:bg-neutral-900'
                  )}
                >
                  {isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      {t('mostPopular')}
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      {tier.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {tier.description}
                    </p>
                  </div>

                  <div className="mb-6 flex items-end gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${tier.name}-${annual ? 'annual' : 'monthly'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="font-mono text-4xl font-bold text-[var(--navy)] dark:text-white"
                      >
                        {amount}
                      </motion.span>
                    </AnimatePresence>
                    {period && <span className="mb-1 text-sm text-neutral-400">{period}</span>}
                  </div>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className="mt-0.5 size-4 shrink-0"
                          style={{ color: 'var(--brand)' }}
                          aria-hidden="true"
                        />
                        <span className="text-sm text-neutral-600 dark:text-neutral-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/sign-up"
                    className={cn(
                      'block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]',
                      isPopular
                        ? 'text-white shadow-sm'
                        : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                    )}
                    style={isPopular ? { backgroundColor: 'var(--brand)' } : undefined}
                  >
                    {isFree ? t('ctaFree') : t('ctaPaid')}
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t('microcopy')}
          </p>
        </div>
      </section>
    </MotionConfig>
  )
}
