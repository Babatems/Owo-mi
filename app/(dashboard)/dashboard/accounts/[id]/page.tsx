import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { getAccountBySlug } from '@/lib/actions/accounts'
import { getTransactions } from '@/lib/actions/transactions'
import { getCategories } from '@/lib/actions/categories'
import { Currency } from '@/components/ui/currency'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { AddTransactionButton } from '@/components/accounts/add-transaction-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Chequing',
  savings: 'Savings',
  credit: 'Credit',
  tfsa: 'TFSA',
  rrsp: 'RRSP',
  fhsa: 'FHSA',
  resp: 'RESP',
  investment: 'Investment',
  cash: 'Cash',
}

async function AccountDetail({ slug }: { slug: string }) {
  const [account, categories] = await Promise.all([getAccountBySlug(slug), getCategories()])

  if (!account) notFound()

  const txs = await getTransactions({ accountId: account.id, limit: 100 })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/accounts">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 gap-1 text-neutral-500 hover:text-neutral-700"
          >
            <ChevronLeft className="size-4" />
            Accounts
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-neutral-900">{account.name}</h1>
          <Badge variant="secondary">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</Badge>
        </div>
        {account.institution && (
          <p className="mt-0.5 text-sm text-neutral-500">{account.institution}</p>
        )}
      </div>

      <Card className="border-neutral-200">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Currency
            cents={account.balanceCents}
            currency={account.currency}
            className="text-3xl font-semibold"
            colorCode={account.type === 'credit'}
          />
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-700">
              Transactions ({txs.length})
            </CardTitle>
            <AddTransactionButton
              account={{ id: account.id, name: account.name, type: account.type }}
              categories={categories}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {txs.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
              No transactions for this account.
            </p>
          ) : (
            txs.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} showActions categories={categories} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <AccountDetail slug={id} />
    </Suspense>
  )
}
