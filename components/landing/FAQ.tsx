'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'

type FAQItem = {
  q: string
  a: string
}

function FAQAccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false)
  const id = `faq-${index}`

  return (
    <div className="border-b border-neutral-200/60 last:border-0 dark:border-neutral-800/60">
      <button
        id={`${id}-btn`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-medium text-neutral-900 dark:text-white">{item.q}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-neutral-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pr-8 pb-5 text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const t = useTranslations('faq')
  const items = t.raw('items') as FAQItem[]

  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 sm:py-28" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-sm font-semibold tracking-wider uppercase"
              style={{ color: 'var(--brand)' }}
            >
              {t('sectionLabel')}
            </p>
            <h2
              id="faq-heading"
              className="text-3xl font-bold tracking-tight text-[var(--navy)] sm:text-4xl dark:text-white"
            >
              {t('headline')}
            </h2>
          </div>

          <div className="rounded-2xl border border-neutral-200/70 bg-white px-6 dark:border-neutral-700/60 dark:bg-neutral-900">
            {items.map((item, i) => (
              <FAQAccordionItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  )
}
