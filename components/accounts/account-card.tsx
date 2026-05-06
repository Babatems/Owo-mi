import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Currency } from '@/components/ui/currency'

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

type Account = {
  id: string
  name: string
  type: string
  balanceCents: number
  currency: string
  institution: string | null
}

export function AccountCard({ account }: { account: Account }) {
  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="cursor-pointer border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{account.name}</p>
              {account.institution && (
                <p className="mt-0.5 truncate text-xs text-neutral-400">{account.institution}</p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
            </Badge>
          </div>
          <div className="mt-3">
            <Currency
              cents={account.balanceCents}
              currency={account.currency}
              className="text-xl"
              colorCode={account.type === 'credit'}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
