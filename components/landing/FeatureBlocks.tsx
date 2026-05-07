import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

function MockTransactionList() {
  const transactions = [
    { name: 'Loblaws', cat: 'Groceries', amt: '−$87.42', color: '#10B981' },
    { name: 'Presto Card', cat: 'Transit', amt: '−$156.00', color: '#6366F1' },
    { name: 'Payroll — May', cat: 'Income', amt: '+$3,125.00', color: '#0e6b4f', income: true },
    { name: 'Netflix', cat: 'Subscriptions', amt: '−$18.99', color: '#EF4444' },
    { name: 'Tim Hortons', cat: 'Dining', amt: '−$4.85', color: '#F59E0B' },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          All Accounts · May 2026
        </p>
      </div>
      <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
        {transactions.map((tx) => (
          <div key={tx.name} className="flex items-center gap-3 px-5 py-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: tx.color + '18', color: tx.color }}
            >
              {tx.cat[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                {tx.name}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-300">{tx.cat}</p>
            </div>
            <p
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: tx.income ? '#0e6b4f' : '#374151' }}
            >
              {tx.amt}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockGoalsView() {
  const accounts = [
    { name: 'TFSA', label: 'Tax-Free Savings', target: 30000, current: 18500, color: '#0e6b4f' },
    { name: 'RRSP', label: 'Retirement Savings', target: 50000, current: 42300, color: '#6366F1' },
    { name: 'FHSA', label: 'First Home Savings', target: 40000, current: 8000, color: '#F59E0B' },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Registered Accounts
        </p>
      </div>
      <div className="space-y-4 p-5">
        {accounts.map(({ name, label, target, current, color }) => {
          const pct = Math.round((current / target) * 100)
          return (
            <div key={name}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {name}
                    </span>
                    <span className="text-xs text-neutral-500">{label}</span>
                  </div>
                </div>
                <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                  ${current.toLocaleString()}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-neutral-400">
                <span>Target: ${target.toLocaleString()}</span>
                <span>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MockBudgetView() {
  const budgets = [
    { cat: 'Groceries', budget: 600, spent: 468, color: '#10B981' },
    { cat: 'Dining', budget: 200, spent: 188, color: '#F59E0B' },
    { cat: 'Shopping', budget: 300, spent: 135, color: '#6366F1' },
    { cat: 'Entertainment', budget: 100, spent: 42, color: '#EC4899' },
    { cat: 'Transit', budget: 200, spent: 156, color: '#0e6b4f' },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-xl dark:border-neutral-700/60 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">May Budgets</p>
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
          On track
        </span>
      </div>
      <div className="space-y-3.5 p-5">
        {budgets.map(({ cat, budget, spent, color }) => {
          const pct = Math.round((spent / budget) * 100)
          return (
            <div key={cat}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-200">{cat}</span>
                <span className="font-mono text-neutral-500">
                  ${spent} / ${budget}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type FeatureBlockProps = {
  label: string
  headline: string
  body: string
  visual: React.ReactNode
  reversed?: boolean
}

function FeatureBlock({ label, headline, body, visual, reversed }: FeatureBlockProps) {
  return (
    <div
      className={`reveal-on-scroll grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 ${reversed ? 'lg:direction-rtl' : ''}`}
    >
      <div className={reversed ? 'lg:order-2' : 'lg:order-1'}>
        <p
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: 'var(--brand)' }}
        >
          {label}
        </p>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-3xl dark:text-white">
          {headline}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
          {body}
        </p>
        <Link
          href="/sign-up"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--brand)' }}
        >
          Get started free <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className={reversed ? 'lg:order-1' : 'lg:order-2'}>{visual}</div>
    </div>
  )
}

export async function FeatureBlocks() {
  const t = await getTranslations('features')

  return (
    <section className="py-20 sm:py-28" aria-label="Feature details">
      <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6">
        <FeatureBlock
          label="Track"
          headline={t('block1.headline')}
          body={t('block1.body')}
          visual={<MockTransactionList />}
        />
        <FeatureBlock
          label="Save"
          headline={t('block2.headline')}
          body={t('block2.body')}
          visual={<MockGoalsView />}
          reversed
        />
        <FeatureBlock
          label="Budget"
          headline={t('block3.headline')}
          body={t('block3.body')}
          visual={<MockBudgetView />}
        />
      </div>
    </section>
  )
}
