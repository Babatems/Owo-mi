'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/transaction-form'
import type { CategoryTree } from '@/lib/actions/categories'

type Account = { id: string; name: string; type: string }

interface AddTransactionButtonProps {
  account: Account
  categories: CategoryTree[]
}

export function AddTransactionButton({ account, categories }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add transaction
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add transaction — {account.name}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            accounts={[account]}
            categories={categories}
            defaultAccountId={account.id}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
