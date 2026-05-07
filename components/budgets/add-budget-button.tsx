'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BudgetForm } from './budget-form'
import { cn } from '@/lib/utils'

type Category = { id: string; name: string; type: string }

export function AddBudgetButton({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
      >
        <Plus className="size-4" />
        Add budget
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add budget</DialogTitle>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            onSuccess={() => {
              setOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
