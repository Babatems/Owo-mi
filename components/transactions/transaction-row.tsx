import { formatDate } from '@/lib/utils/dates'
import { Currency } from '@/components/ui/currency'
import { Badge } from '@/components/ui/badge'

type Transaction = {
  id: string
  description: string
  amountCents: number
  currency: string
  date: Date
  reviewed: boolean
  category: { id: string; name: string; icon: string | null } | null
  account: { id: string; name: string; type: string } | null
}

export function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 py-3 last:border-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
        {tx.category?.icon ?? '•'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{tx.description}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {tx.category?.name ?? <span className="text-amber-500">Uncategorized</span>}
          {tx.account && <span> · {tx.account.name}</span>}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <Currency
          cents={tx.amountCents}
          currency={tx.currency}
          className="text-sm"
          colorCode
          showSign
        />
        <p className="mt-0.5 text-xs text-neutral-400">{formatDate(tx.date, 'relative')}</p>
      </div>
    </div>
  )
}
