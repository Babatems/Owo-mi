'use client'

import { motion, useScroll, useTransform, MotionConfig } from 'motion/react'
import { useRef } from 'react'
import { TrendingDown, TrendingUp, Target, Wallet } from 'lucide-react'

const TRANSACTIONS = [
  { name: 'Loblaws', category: 'Groceries', amount: -8742, date: 'Today', color: '#10B981' },
  { name: 'Tim Hortons', category: 'Dining', amount: -485, date: 'Today', color: '#F59E0B' },
  { name: 'Presto Card', category: 'Transit', amount: -15600, date: 'Yesterday', color: '#6366F1' },
  { name: 'Payroll', category: 'Income', amount: 312500, date: 'May 1', color: '#0e6b4f' },
  { name: 'Netflix', category: 'Subscriptions', amount: -1899, date: 'Apr 30', color: '#EF4444' },
]

function formatCAD(cents: number) {
  const abs = Math.abs(cents) / 100
  const formatted = abs.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${cents < 0 ? '−' : '+'}$${formatted}`
}

export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 60])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.4])

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        ref={ref}
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative w-full max-w-md"
        aria-hidden="true"
      >
        {/* Dashboard card */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-700/60 dark:bg-neutral-900">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">May 2026</p>
              <p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">Overview</p>
            </div>
            <div
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              All accounts
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-neutral-100 px-0 dark:divide-neutral-800">
            {[
              { label: 'Income', value: '$3,125', icon: TrendingUp, color: '#0e6b4f' },
              { label: 'Spent', value: '$1,847', icon: TrendingDown, color: '#EF4444' },
              { label: 'Saved', value: '$1,278', icon: Target, color: '#6366F1' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex flex-col items-center py-4">
                <Icon className="mb-1 size-3.5" style={{ color }} />
                <p className="font-mono text-base font-semibold text-neutral-900 dark:text-white">
                  {value}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div className="px-5 pt-3 pb-4">
            <p className="mb-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-400">
              Recent transactions
            </p>
            <div className="space-y-3">
              {TRANSACTIONS.map((tx) => (
                <div key={tx.name} className="flex items-center gap-3">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: tx.color + '18' }}
                  >
                    <Wallet className="size-3.5" style={{ color: tx.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {tx.name}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-300">{tx.category}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: tx.amount > 0 ? '#0e6b4f' : '#374151' }}
                    >
                      {formatCAD(tx.amount)}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-300">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TFSA bar */}
          <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  TFSA Goal
                </p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  $18,500 / $30,000
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">62%</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--brand)' }}
                initial={{ width: '0%' }}
                animate={{ width: '62%' }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="absolute top-8 -right-12 hidden rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-lg lg:block dark:border-neutral-700 dark:bg-neutral-800"
        >
          <p className="text-xs font-semibold text-[var(--brand)]">🇨🇦 Data in Canada</p>
        </motion.div>

        {/* Floating subscription badge */}
        <motion.div
          initial={{ opacity: 0, x: -20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="absolute -bottom-5 -left-4 hidden rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-lg lg:block dark:border-neutral-700 dark:bg-neutral-800"
        >
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            ✓ Read-only access
          </p>
        </motion.div>
      </motion.div>
    </MotionConfig>
  )
}
