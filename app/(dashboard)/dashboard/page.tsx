import { Suspense } from 'react'
import Link from 'next/link'
import { getAccounts } from '@/lib/actions/accounts'
import { getTransactions } from '@/lib/actions/transactions'
import { getActiveFamily } from '@/lib/actions/families'
import { getBudgetsWithActual } from '@/lib/actions/budgets'
import { getGoals } from '@/lib/actions/goals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Currency } from '@/components/ui/currency'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { Skeleton } from '@/components/ui/skeleton'
import { startOfMonth } from '@/lib/utils/dates'
import { CreateFamilyForm } from '@/components/families/create-family-form'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

// ─── Canadian registered-account contribution limits (2026) ──────────────────
const REGISTERED_TYPES = new Set(['tfsa', 'rrsp', 'fhsa', 'resp'])
const REGISTERED_LABELS: Record<string, string> = {
  tfsa: 'TFSA',
  rrsp: 'RRSP',
  fhsa: 'FHSA',
  resp: 'RESP',
}
const REGISTERED_ANNUAL_LIMIT: Record<string, number> = {
  tfsa: 700000,
  rrsp: 3381000,
  fhsa: 800000,
}

async function DashboardContent() {
  const family = await getActiveFamily().catch(() => null)

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Welcome to Owó-mi
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Create a family to start tracking your finances.
        </p>
        <div className="mt-6 w-full max-w-sm">
          <CreateFamilyForm />
        </div>
      </div>
    )
  }

  const monthStart = startOfMonth()

  const [accounts, recentTxs, monthlyTxs, budgets, goals] = await Promise.all([
    getAccounts(),
    getTransactions({ limit: 8 }),
    getTransactions({ startDate: monthStart, limit: 100 }),
    getBudgetsWithActual(monthStart).catch(
      () => [] as Awaited<ReturnType<typeof getBudgetsWithActual>>
    ),
    getGoals().catch(() => [] as Awaited<ReturnType<typeof getGoals>>),
  ])

  const netWorthCents = accounts.reduce(
    (sum: number, acc: { type: string; balanceCents: number }) =>
      acc.type === 'credit' ? sum - acc.balanceCents : sum + acc.balanceCents,
    0
  )

  const monthlySpendingCents = monthlyTxs
    .filter((tx) => tx.amountCents < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amountCents), 0)
  const monthlyIncomeCents = monthlyTxs
    .filter((tx) => tx.amountCents > 0)
    .reduce((sum, tx) => sum + tx.amountCents, 0)
  const netCents = monthlyIncomeCents - monthlySpendingCents

  // Spending by category
  const categorySpend: Map<string, { name: string; cents: number }> = new Map()
  for (const tx of monthlyTxs) {
    if (tx.amountCents >= 0) continue
    const key = tx.category?.id ?? '__uncategorized__'
    const name = tx.category?.name ?? 'Uncategorized'
    const existing = categorySpend.get(key)
    if (existing) {
      existing.cents += Math.abs(tx.amountCents)
    } else {
      categorySpend.set(key, { name, cents: Math.abs(tx.amountCents) })
    }
  }
  const topCategories = Array.from(categorySpend.values())
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 6)

  // Registered accounts with contribution room
  const registeredAccounts = accounts.filter(
    (a) => REGISTERED_TYPES.has(a.type) && a.contributionRoomCents != null
  )

  // Budget health: top categories by % consumed
  const atRiskBudgets = budgets.filter((b) => b.percentUsed >= 70).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          {family?.name ?? 'Dashboard'}
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="col-span-2 border-neutral-200 sm:col-span-1 dark:border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency cents={netWorthCents} className="text-2xl font-semibold" colorCode />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency
              cents={monthlyIncomeCents}
              className="text-xl font-semibold text-emerald-600"
            />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency
              cents={-monthlySpendingCents}
              className="text-xl font-semibold text-red-600"
            />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency cents={netCents} className="text-xl font-semibold" colorCode showSign />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spending by category */}
        {topCategories.length > 0 && (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Spending by category
                </CardTitle>
                <Link
                  href="/dashboard/transactions"
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {topCategories.map((cat, i) => {
                const pct = monthlySpendingCents > 0 ? (cat.cents / monthlySpendingCents) * 100 : 0
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between text-sm">
                      <span className="truncate text-neutral-700 dark:text-neutral-200">
                        {cat.name}
                      </span>
                      <Currency
                        cents={cat.cents}
                        className="ml-2 shrink-0 text-sm text-neutral-700 dark:text-neutral-200"
                      />
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700/50">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Budget health */}
        {atRiskBudgets.length > 0 && (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Budget health
                </CardTitle>
                <Link
                  href="/dashboard/budgets"
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  Manage <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {atRiskBudgets.map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-neutral-700 dark:text-neutral-200">
                      {b.categoryName}
                    </span>
                    <span
                      className={cn(
                        'ml-2 shrink-0 text-xs font-medium',
                        b.percentUsed >= 100 ? 'text-red-600' : 'text-amber-600'
                      )}
                    >
                      {Math.round(b.percentUsed)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700/50">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        b.percentUsed >= 100 ? 'bg-red-500' : 'bg-amber-400'
                      )}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Goals progress */}
        {goals.length > 0 && (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Savings goals
                </CardTitle>
                <Link
                  href="/dashboard/goals"
                  className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {goals.slice(0, 4).map((goal) => {
                const current = goal.linkedAccount
                  ? Math.max(0, goal.linkedAccount.balanceCents)
                  : goal.currentAmountCents
                const pct =
                  goal.targetAmountCents > 0
                    ? Math.min((current / goal.targetAmountCents) * 100, 100)
                    : 0
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate text-neutral-700 dark:text-neutral-200">
                        {goal.name}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-neutral-400 dark:text-neutral-300">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700/50">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Canadian registered accounts */}
      {registeredAccounts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Registered accounts
            </h2>
            <Link
              href="/dashboard/accounts"
              className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {registeredAccounts.map((acc) => {
              const annualLimit = REGISTERED_ANNUAL_LIMIT[acc.type]
              const roomPct =
                annualLimit && acc.contributionRoomCents != null
                  ? Math.min((acc.contributionRoomCents / annualLimit) * 100, 100)
                  : null
              return (
                <Link key={acc.id} href={`/dashboard/accounts/${acc.slug ?? acc.id}`}>
                  <Card className="h-full cursor-pointer border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:hover:border-neutral-700">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          )}
                        >
                          {REGISTERED_LABELS[acc.type] ?? acc.type.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {acc.name}
                        </p>
                        <Currency
                          cents={acc.contributionRoomCents!}
                          className="text-base font-semibold text-violet-700 dark:text-violet-300"
                        />
                        <p className="text-xs text-neutral-400 dark:text-neutral-300">
                          room remaining
                        </p>
                      </div>
                      {roomPct !== null && (
                        <div className="h-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
                          <div
                            className="h-full rounded-full bg-violet-400"
                            style={{ width: `${roomPct}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Recent transactions
            </CardTitle>
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentTxs.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No transactions yet.{' '}
              <Link
                href="/dashboard/transactions/new"
                className="text-neutral-600 underline dark:text-neutral-300"
              >
                Add your first transaction
              </Link>
            </p>
          ) : (
            recentTxs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-neutral-200 dark:border-neutral-800">
            <CardContent className="pt-6">
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
