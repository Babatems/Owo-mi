'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GoalForm } from './goal-form'
import { cn } from '@/lib/utils'

type Account = { id: string; name: string; type: string }

export function AddGoalButton({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
      >
        <Plus className="size-4" />
        New goal
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create savings goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            accounts={accounts}
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
