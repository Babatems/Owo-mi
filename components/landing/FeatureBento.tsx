import { getTranslations } from 'next-intl/server'
import { Wallet, Target, CreditCard, Languages, TrendingDown } from 'lucide-react'

function BentoCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'group overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-6 transition-all duration-200 hover:shadow-lg dark:border-neutral-700/60 dark:bg-neutral-900',
        className,
      ].join(' ')}
      style={{ viewTransitionName: 'bento-card' }}
    >
      {children}
    </div>
  )
}

const SPEND_CATEGORIES = [
  { label: 'Groceries', percent: 32, color: '#10B981' },
  { label: 'Dining', percent: 18, color: '#F59E0B' },
  { label: 'Transit', percent: 12, color: '#6366F1' },
  { label: 'Subscriptions', percent: 8, color: '#EF4444' },
  { label: 'Other', percent: 30, color: '#D1D5DB' },
]

const ACCOUNTS_LIST = [
  { name: 'TFSA', bank: 'TD', balance: '$18,500', color: '#0e6b4f' },
  { name: 'RRSP', bank: 'RBC', balance: '$42,300', color: '#6366F1' },
  { name: 'FHSA', bank: 'Scotiabank', balance: '$8,000', color: '#F59E0B' },
  { name: 'RESP', bank: 'BMO', balance: '$12,150', color: '#EC4899' },
]

const BUDGET_ITEMS = [
  { label: 'Groceries', used: 78, color: '#10B981' },
  { label: 'Dining', used: 94, color: '#F59E0B' },
  { label: 'Shopping', used: 45, color: '#6366F1' },
  { label: 'Transit', used: 60, color: '#0e6b4f' },
]

export async function FeatureBento() {
  const t = await getTranslations('features')
  const b = await getTranslations('features.bento')

  return (
    <section
      id="features"
      className="reveal-on-scroll py-20 sm:py-28"
      aria-labelledby="features-heading"
      style={{
        scrollMarginTop: '4rem',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section label */}
        <div className="mb-12 text-center">
          <p
            className="mb-2 text-sm font-semibold tracking-wider uppercase"
            style={{ color: 'var(--brand)' }}
          >
            {t('sectionLabel')}
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-[var(--navy)] sm:text-4xl dark:text-white"
          >
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-500 dark:text-neutral-400">
            {t('subheadline')}
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* 1: Large spending dashboard — col-span-8 */}
          <BentoCard className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown
                  className="size-4"
                  style={{ color: 'var(--brand)' }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {b('spending')} — May
                </span>
              </div>
              <span className="font-mono text-sm font-semibold text-neutral-400">$1,847</span>
            </div>

            {/* Category bars */}
            <div className="space-y-2.5">
              {SPEND_CATEGORIES.map(({ label, percent, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                    {label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-neutral-500">
                    {percent}%
                  </span>
                </div>
              ))}
            </div>

            {/* Micro-transactions */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { name: 'Loblaws', amt: '$87.42', date: 'Today' },
                { name: 'Tim Hortons', amt: '$4.85', date: 'Today' },
                { name: 'Presto', amt: '$156.00', date: 'Yesterday' },
              ].map(({ name, amt, date }) => (
                <div
                  key={name}
                  className="rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800"
                >
                  <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-200">
                    {name}
                  </p>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                    {amt}
                  </p>
                  <p className="text-xs text-neutral-400">{date}</p>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* 2: Canadian registered accounts — col-span-4, 2 rows */}
          <BentoCard className="lg:col-span-4 lg:row-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-4" style={{ color: 'var(--brand)' }} aria-hidden="true" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {b('savings')}
              </span>
            </div>

            <div className="space-y-3">
              {ACCOUNTS_LIST.map(({ name, bank, balance, color }) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-3 dark:bg-neutral-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {name}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                        {bank}
                      </p>
                      <p className="text-xs text-neutral-400">{b('contributionRoom')}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                    {balance}
                  </p>
                </div>
              ))}
            </div>

            {/* Goal ring placeholder */}
            <div className="mt-4 flex items-center justify-center">
              <div className="relative">
                <svg width="160" height="160" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="201"
                    strokeDashoffset="77"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                    62%
                  </span>
                  <span className="text-xs text-neutral-400">TFSA</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 3: Budget health — col-span-4 */}
          <BentoCard className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="size-4" style={{ color: 'var(--brand)' }} aria-hidden="true" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {b('budgetHealth')}
              </span>
            </div>
            <div className="space-y-3">
              {BUDGET_ITEMS.map(({ label, used, color }) => {
                const status = used >= 90 ? b('nearLimit') : b('onTrack')
                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">
                        {label}
                      </span>
                      <span className="text-neutral-400">{used}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${used}%`, backgroundColor: color }}
                      />
                    </div>
                    <p
                      className="mt-0.5 text-right text-xs"
                      style={{ color: used >= 90 ? '#EF4444' : '#10B981' }}
                    >
                      {status}
                    </p>
                  </div>
                )
              })}
            </div>
          </BentoCard>

          {/* 4: Bilingual card — col-span-4 */}
          <BentoCard className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <Languages className="size-4" style={{ color: 'var(--brand)' }} aria-hidden="true" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {b('bilingual')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col rounded-xl border-2 border-[var(--brand)] bg-[var(--brand-light)] p-3 dark:bg-[var(--brand)]/10">
                <p className="mb-1 text-xs font-semibold text-[var(--brand)]">EN</p>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  &quot;Finally know where your money goes.&quot;
                </p>
                <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                  <p>TFSA · RRSP · FHSA</p>
                  <p>🇨🇦 PIPEDA compliant</p>
                </div>
              </div>
              <div className="flex flex-col rounded-xl border-2 border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <p className="mb-1 text-xs font-semibold text-neutral-400">FR</p>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  &quot;Votre argent. En entier. Enfin clair.&quot;
                </p>
                <div className="mt-2 space-y-0.5 text-xs text-neutral-500">
                  <p>CELI · REER · CELIAPP</p>
                  <p>🇨🇦 Conforme Loi 25</p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 5: Connected accounts — col-span-4 */}
          <BentoCard className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="size-4" style={{ color: 'var(--brand)' }} aria-hidden="true" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {b('accounts')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['TD', 'RBC', 'BMO', 'Scotia', 'CIBC', "Nat'l"].map((bank) => (
                <div
                  key={bank}
                  className="flex items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 py-2.5 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {bank}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-neutral-400">+ 250 more institutions</p>
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
