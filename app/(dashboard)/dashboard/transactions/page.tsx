import { Suspense } from 'react'
import Link from 'next/link'
import { getTransactions } from '@/lib/actions/transactions'
import { getAccounts } from '@/lib/actions/accounts'
import { getCategories } from '@/lib/actions/categories'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Upload } from 'lucide-react'

async function TransactionsList() {
  const [txs, accounts, categories] = await Promise.all([
    getTransactions({ limit: 100 }),
    getAccounts(),
    getCategories(),
  ])

  const accountsMini = accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {txs.length} transaction{txs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/transactions/import">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Upload className="size-4" />
              Import
            </Button>
          </Link>
          <Link href="/dashboard/transactions/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="pt-4">
          {txs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-neutral-500">No transactions yet.</p>
              <Link href="/dashboard/transactions/new">
                <Button variant="outline" size="sm" className="mt-3">
                  Add your first transaction
                </Button>
              </Link>
            </div>
          ) : (
            txs.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                showActions
                accounts={accountsMini}
                categories={categories}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <TransactionsList />
    </Suspense>
  )
}
