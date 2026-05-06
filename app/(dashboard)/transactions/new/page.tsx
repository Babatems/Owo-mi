import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAccounts } from '@/lib/actions/accounts'
import { getCategories } from '@/lib/actions/categories'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

async function NewTransactionContent() {
  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()])

  if (accounts.length === 0) {
    redirect('/accounts')
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Add transaction</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Record a new expense or income.</p>
      </div>
      <Card className="border-neutral-200">
        <CardContent className="pt-6">
          <TransactionForm accounts={accounts} categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full max-w-lg" />}>
      <NewTransactionContent />
    </Suspense>
  )
}
