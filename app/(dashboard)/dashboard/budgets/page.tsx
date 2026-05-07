import { Suspense } from 'react'
import { getBudgetsWithActual } from '@/lib/actions/budgets'
import { getCategoriesFlat } from '@/lib/actions/categories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Currency } from '@/components/ui/currency'
import { BudgetCategoryRow } from '@/components/budgets/budget-category-row'
import { AddBudgetButton } from '@/components/budgets/add-budget-button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

async function BudgetContent() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [budgets, categories] = await Promise.all([
    getBudgetsWithActual(monthStart),
    getCategoriesFlat(),
  ])

  const monthLabel = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })

  const totalBudgeted = budgets.reduce((s, b) => s + b.amountCents, 0)
  const totalActual = budgets.reduce((s, b) => s + b.actualCents, 0)
  const totalRemaining = totalBudgeted - totalActual
  const overBudget = budgets.filter((b) => b.percentUsed >= 100)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Budget</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{monthLabel}</p>
        </div>
        <AddBudgetButton categories={categories} />
      </div>

      {/* Over-budget alert */}
      {overBudget.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            {overBudget.length === 1
              ? `${overBudget[0].categoryName} is over budget this month.`
              : `${overBudget.length} categories are over budget this month.`}
          </p>
        </div>
      )}

      {/* Summary row */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-neutral-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Budgeted
              </p>
              <Currency cents={totalBudgeted} className="mt-1 text-lg font-semibold" />
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Spent</p>
              <Currency cents={totalActual} className="mt-1 text-lg font-semibold" />
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardContent className="p-3">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Remaining
              </p>
              <Currency
                cents={totalRemaining}
                className={cn(
                  'mt-1 text-lg font-semibold',
                  totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600'
                )}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget rows */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-700">
            {budgets.length > 0
              ? `${budgets.length} budget${budgets.length !== 1 ? 's' : ''}`
              : 'No budgets yet'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {budgets.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              {expenseCategories.length === 0 ? (
                <>
                  <p className="text-sm text-neutral-500">
                    You need expense categories before adding budgets.
                  </p>
                  <p className="text-xs text-neutral-400">
                    Go to Transactions → add a transaction to create categories, or ask your family
                    admin.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-500">No budgets set for {monthLabel}.</p>
                  <p className="text-xs text-neutral-400">
                    Click &ldquo;Add budget&rdquo; to set spending limits per category.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {budgets.map((budget) => (
                <BudgetCategoryRow key={budget.id} budget={budget} categories={categories} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {budgets.length > 0 && (
        <p className="text-xs text-neutral-400">
          Budgets track expenses in the current month. Bi-weekly and weekly periods are supported —
          set the period start date when adding a budget.
        </p>
      )}
    </div>
  )
}

function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetSkeleton />}>
      <BudgetContent />
    </Suspense>
  )
}
