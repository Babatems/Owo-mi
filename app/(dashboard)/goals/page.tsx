import { Suspense } from 'react'
import { getGoals } from '@/lib/actions/goals'
import { getAccounts } from '@/lib/actions/accounts'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

async function GoalsList() {
  const [goals, accounts] = await Promise.all([getGoals(), getAccounts()])

  const accountsMini = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Savings Goals</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog>
          <DialogTrigger className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
            <Plus className="size-4" />
            New goal
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create savings goal</DialogTitle>
            </DialogHeader>
            <GoalForm accounts={accountsMini} />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="border-dashed border-neutral-200">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-neutral-500">No goals yet.</p>
            <p className="mt-1 text-xs text-neutral-400">
              Create a savings goal — TFSA top-up, vacation, emergency fund, or anything else.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={{
                ...goal,
                targetDate: goal.targetDate ?? null,
                linkedAccountId: goal.linkedAccountId ?? null,
                linkedAccount: goal.linkedAccount
                  ? {
                      ...goal.linkedAccount,
                      type: goal.linkedAccount.type as string,
                    }
                  : null,
              }}
              accounts={accountsMini}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <GoalsList />
    </Suspense>
  )
}
