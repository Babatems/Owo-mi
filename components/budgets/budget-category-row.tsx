'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Currency } from '@/components/ui/currency'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BudgetForm } from './budget-form'
import { deleteBudget } from '@/lib/actions/budgets'
import { MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BudgetWithActual } from '@/lib/actions/budgets'

type Category = { id: string; name: string; type: string }

interface BudgetCategoryRowProps {
  budget: BudgetWithActual
  categories: Category[]
}

function varianceColor(percent: number) {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function varianceBadge(percent: number, remainingCents: number) {
  if (percent >= 100) {
    return (
      <Badge className="bg-red-50 text-xs text-red-700 hover:bg-red-50">
        <Currency cents={Math.abs(remainingCents)} className="text-xs" /> over
      </Badge>
    )
  }
  if (percent >= 80) {
    return (
      <Badge className="bg-amber-50 text-xs text-amber-700 hover:bg-amber-50">
        <Currency cents={remainingCents} className="text-xs" /> left
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-50 text-xs text-emerald-700 hover:bg-emerald-50">
      <Currency cents={remainingCents} className="text-xs" /> left
    </Badge>
  )
}

export function BudgetCategoryRow({ budget, categories }: BudgetCategoryRowProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Remove budget for "${budget.categoryName}"?`)) return
    setDeleting(true)
    await deleteBudget(budget.id)
    router.refresh()
  }

  const clampedPercent = Math.min(budget.percentUsed, 100)

  return (
    <div className="group flex flex-col gap-2 border-b border-neutral-100 py-3 first:pt-0 last:border-0 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {budget.categoryIcon && <span className="text-base">{budget.categoryIcon}</span>}
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-white">
            {budget.categoryName}
          </span>
          {budget.carryoverEnabled && (
            <RefreshCw className="size-3 shrink-0 text-neutral-400 dark:text-neutral-500" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {varianceBadge(budget.percentUsed, budget.remainingCents)}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
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
                {deleting ? 'Removing…' : 'Remove'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit budget — {budget.categoryName}</DialogTitle>
              </DialogHeader>
              <BudgetForm
                categories={categories}
                budget={budget}
                onSuccess={() => {
                  setEditOpen(false)
                  router.refresh()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700/50">
        <div
          className={cn('h-full rounded-full transition-all', varianceColor(budget.percentUsed))}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Planned / Actual / Remaining */}
      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <span className="font-medium text-neutral-700 tabular-nums dark:text-neutral-200">
            <Currency cents={budget.actualCents} className="text-xs" />
          </span>{' '}
          spent
        </span>
        <span className="tabular-nums">
          of <Currency cents={budget.amountCents} className="text-xs" /> budgeted
          <span className="ml-1 text-neutral-400 dark:text-neutral-500">
            ({Math.round(budget.percentUsed)}%)
          </span>
        </span>
      </div>
    </div>
  )
}
