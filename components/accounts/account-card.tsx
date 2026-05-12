'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Currency } from '@/components/ui/currency'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountForm } from './account-form'
import { deleteAccount } from '@/lib/actions/accounts'
import { MoreHorizontal, Pencil, Trash2, ArrowRight } from 'lucide-react'

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

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  checking: 'bg-blue-50 text-blue-700',
  savings: 'bg-emerald-50 text-emerald-700',
  credit: 'bg-rose-50 text-rose-700',
  tfsa: 'bg-violet-50 text-violet-700',
  rrsp: 'bg-amber-50 text-amber-700',
  fhsa: 'bg-sky-50 text-sky-700',
  resp: 'bg-orange-50 text-orange-700',
  investment: 'bg-indigo-50 text-indigo-700',
  cash: 'bg-neutral-100 text-neutral-600',
}

const REGISTERED_TYPES = new Set(['tfsa', 'rrsp', 'fhsa', 'resp'])

const CONTRIBUTION_LIMITS: Record<string, number> = {
  tfsa: 700000, // $7,000 annual
  rrsp: 3381000, // $33,810 annual
  fhsa: 800000, // $8,000 annual
  resp: 5000000, // $50,000 lifetime
}

type Account = {
  id: string
  name: string
  slug: string | null
  type: string
  balanceCents: number
  currency: string
  institution: string | null
  last4?: string | null
  notes?: string | null
  contributionRoomCents?: number | null
}

export function AccountCard({ account }: { account: Account }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteAccount(account.id)
    router.refresh()
  }

  return (
    <>
      <Card className="group relative border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:hover:border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-neutral-900 dark:text-white">
                {account.name}
              </p>
              {account.institution && (
                <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-300">
                  {account.institution}
                </p>
              )}
              {account.last4 && (
                <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-300">
                  ····{account.last4}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACCOUNT_TYPE_COLORS[account.type] ?? 'bg-neutral-100 text-neutral-600'}`}
              >
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="hoverdevice:opacity-0 hoverdevice:group-hover:opacity-100 rounded p-1 text-neutral-400 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/accounts/${account.slug ?? account.id}`)}
                  >
                    <ArrowRight className="mr-2 size-3.5" />
                    View transactions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Link href={`/dashboard/accounts/${account.slug ?? account.id}`} className="mt-4 block">
            <Currency
              cents={account.balanceCents}
              currency={account.currency}
              className="text-2xl font-semibold"
              colorCode={account.type === 'credit'}
            />
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-300">Current balance</p>
          </Link>

          {REGISTERED_TYPES.has(account.type) && account.contributionRoomCents != null && (
            <div className="mt-3 rounded-md bg-violet-50 px-3 py-2">
              <p className="text-xs font-medium text-violet-700">
                <Currency
                  cents={account.contributionRoomCents}
                  currency={account.currency}
                  className="text-xs"
                />{' '}
                contribution room
              </p>
              {CONTRIBUTION_LIMITS[account.type] && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{
                      width: `${Math.min(
                        (account.contributionRoomCents / CONTRIBUTION_LIMITS[account.type]) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
          </DialogHeader>
          <AccountForm
            account={account}
            onSuccess={() => {
              setEditOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
