import { Suspense } from 'react'
import Link from 'next/link'
import { getAccounts } from '@/lib/actions/accounts'
import { getTransactions } from '@/lib/actions/transactions'
import { getActiveFamily } from '@/lib/actions/families'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Currency } from '@/components/ui/currency'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { Skeleton } from '@/components/ui/skeleton'
import { startOfMonth } from '@/lib/utils/dates'
import { CreateFamilyForm } from '@/components/families/create-family-form'

async function DashboardContent() {
  const family = await getActiveFamily()

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">Welcome to Owo-mi</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Create a family to start tracking your finances.
        </p>
        <div className="mt-6 w-full max-w-sm">
          <CreateFamilyForm />
        </div>
      </div>
    )
  }

  const [accounts, recentTxs] = await Promise.all([getAccounts(), getTransactions({ limit: 8 })])

  const netWorthCents = accounts.reduce(
    (sum: number, acc: { type: string; balanceCents: number }) => {
      return acc.type === 'credit' ? sum - acc.balanceCents : sum + acc.balanceCents
    },
    0
  )

  const monthStart = startOfMonth()
  const monthlyTxs = await getTransactions({ startDate: monthStart, limit: 500 })
  const monthlySpendingCents = monthlyTxs
    .filter((tx) => tx.amountCents < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amountCents), 0)
  const monthlyIncomeCents = monthlyTxs
    .filter((tx) => tx.amountCents > 0)
    .reduce((sum, tx) => sum + tx.amountCents, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{family?.name ?? 'Dashboard'}</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-neutral-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency cents={netWorthCents} className="text-2xl font-semibold" colorCode />
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Spending this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency
              cents={-monthlySpendingCents}
              className="text-2xl font-semibold text-red-600"
            />
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Income this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Currency
              cents={monthlyIncomeCents}
              className="text-2xl font-semibold text-emerald-600"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-700">
            Recent transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentTxs.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
              No transactions yet.{' '}
              <a href="/transactions/new" className="text-neutral-600 underline">
                Add your first transaction
              </a>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-neutral-200">
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
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
