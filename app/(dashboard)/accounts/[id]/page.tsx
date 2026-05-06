import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getAccount } from '@/lib/actions/accounts'
import { getTransactions } from '@/lib/actions/transactions'
import { Currency } from '@/components/ui/currency'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

async function AccountDetail({ id }: { id: string }) {
  const [account, txs] = await Promise.all([
    getAccount(id),
    getTransactions({ accountId: id, limit: 50 }),
  ])

  if (!account) notFound()

  return (
    <div className="space-y-6">
      <div>
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
          <CardTitle className="text-sm font-medium text-neutral-700">
            Transactions ({txs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {txs.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
              No transactions for this account.
            </p>
          ) : (
            txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
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
      <AccountDetail id={id} />
    </Suspense>
  )
}
