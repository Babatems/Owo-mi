'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Currency } from '@/components/ui/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GoalForm } from './goal-form'
import { deleteGoal, updateGoal } from '@/lib/actions/goals'
import { MoreHorizontal, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseCurrencyInput } from '@/lib/utils/currency'

type Account = { id: string; name: string; type: string }

interface GoalCardProps {
  goal: {
    id: string
    name: string
    targetAmountCents: number
    currentAmountCents: number
    targetDate?: Date | null
    linkedAccountId?: string | null
    linkedAccount?: { id: string; name: string; type: string; balanceCents: number } | null
  }
  accounts: Account[]
}

function calcEta(currentCents: number, targetCents: number, targetDate?: Date | null): string {
  if (!targetDate) return ''
  const remaining = targetCents - currentCents
  if (remaining <= 0) return 'Complete!'
  const now = new Date()
  const target = new Date(targetDate)
  const monthsLeft = Math.max(
    0,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  )
  if (monthsLeft === 0) return 'Due this month'
  const monthlyNeeded = remaining / monthsLeft
  return `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(monthlyNeeded / 100)}/mo needed`
}

export function GoalCard({ goal, accounts }: GoalCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [progressRaw, setProgressRaw] = useState((goal.currentAmountCents / 100).toFixed(2))
  const [saving, setSaving] = useState(false)

  const effectiveCurrent = goal.linkedAccount
    ? Math.max(0, goal.linkedAccount.balanceCents)
    : goal.currentAmountCents

  const percent =
    goal.targetAmountCents > 0
      ? Math.min((effectiveCurrent / goal.targetAmountCents) * 100, 100)
      : 0

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.name}"?`)) return
    setDeleting(true)
    await deleteGoal(goal.id)
    router.refresh()
  }

  async function handleProgressSave() {
    setSaving(true)
    const cents = parseCurrencyInput(progressRaw)
    await updateGoal({ id: goal.id, currentAmountCents: cents })
    setProgressOpen(false)
    setSaving(false)
    router.refresh()
  }

  const eta = calcEta(effectiveCurrent, goal.targetAmountCents, goal.targetDate)
  const isComplete = effectiveCurrent >= goal.targetAmountCents

  return (
    <>
      <Card className="group border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-neutral-900">{goal.name}</p>
              {goal.linkedAccount && (
                <p className="mt-0.5 text-xs text-neutral-400">
                  Auto-tracking · {goal.linkedAccount.name}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isComplete && (
                <Badge className="bg-emerald-50 text-xs text-emerald-700 hover:bg-emerald-50">
                  Complete!
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-100 hover:text-neutral-700">
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {!goal.linkedAccount && (
                    <DropdownMenuItem onClick={() => setProgressOpen(true)}>
                      <TrendingUp className="mr-2 size-3.5" />
                      Update progress
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-3.5" />
                    Edit goal
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

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-emerald-500' : percent >= 75 ? 'bg-blue-500' : 'bg-blue-400'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>
                <Currency
                  cents={effectiveCurrent}
                  className="text-xs font-medium text-neutral-700"
                />
              </span>
              <span>
                <Currency cents={goal.targetAmountCents} className="text-xs" /> target
              </span>
            </div>
          </div>

          {/* ETA or deadline */}
          {(eta || goal.targetDate) && (
            <div className="flex items-center justify-between text-xs text-neutral-400">
              {goal.targetDate && (
                <span>
                  By{' '}
                  {new Date(goal.targetDate).toLocaleDateString('en-CA', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
              {eta && !isComplete && <span className="text-blue-600">{eta}</span>}
            </div>
          )}

          <div className="text-xs text-neutral-400">{Math.round(percent)}% complete</div>
        </CardContent>
      </Card>

      {/* Edit goal dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            accounts={accounts}
            goal={goal}
            onSuccess={() => {
              setEditOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Update progress dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Update progress — {goal.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="progress-amount">Current saved amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">CAD $</span>
                <Input
                  id="progress-amount"
                  inputMode="decimal"
                  value={progressRaw}
                  onChange={(e) => setProgressRaw(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleProgressSave} disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save progress'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
