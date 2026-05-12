'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/dates'
import { Currency } from '@/components/ui/currency'
import { deleteTransaction } from '@/lib/actions/transactions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionEditForm } from './transaction-edit-form'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { CategoryTree } from '@/lib/actions/categories'

type Transaction = {
  id: string
  accountId: string
  description: string
  amountCents: number
  currency: string
  date: Date
  reviewed: boolean
  notes?: string | null
  categoryId?: string | null
  category: { id: string; name: string; icon: string | null } | null
  account: { id: string; name: string; type: string } | null
}

type Account = { id: string; name: string; type: string }

interface TransactionRowProps {
  tx: Transaction
  showActions?: boolean
  accounts?: Account[]
  categories?: CategoryTree[]
}

export function TransactionRow({
  tx,
  showActions = false,
  accounts = [],
  categories = [],
}: TransactionRowProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${tx.description}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteTransaction(tx.id)
    router.refresh()
    setDeleting(false)
  }

  return (
    <>
      <div className="group flex items-center gap-3 border-b border-neutral-100 py-3 last:border-0 dark:border-neutral-800">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm dark:bg-neutral-800">
          {tx.category?.icon ?? '•'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
            {tx.description}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-300">
            {tx.category?.name ?? <span className="text-amber-500">Uncategorized</span>}
            {tx.account && <span> · {tx.account.name}</span>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="text-right">
            <Currency
              cents={tx.amountCents}
              currency={tx.currency}
              className="text-sm"
              colorCode
              showSign
            />
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-300">
              {formatDate(tx.date, 'relative')}
            </p>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger className="hoverdevice:opacity-0 hoverdevice:group-hover:opacity-100 ml-1 rounded p-1 text-neutral-400 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-3.5" />
                  Edit
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
          )}
        </div>
      </div>

      {showActions && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit transaction</DialogTitle>
            </DialogHeader>
            <TransactionEditForm
              tx={tx}
              accounts={accounts}
              categories={categories}
              onSuccess={() => {
                setEditOpen(false)
                router.refresh()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
