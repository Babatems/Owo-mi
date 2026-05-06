'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { createBudgetSchema, type CreateBudgetInput } from '@/lib/validations/schemas'
import { createBudget, updateBudget } from '@/lib/actions/budgets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseCurrencyInput } from '@/lib/utils/currency'
import { toDateInputValue } from '@/lib/utils/dates'

type Category = { id: string; name: string; type: string }

interface BudgetFormProps {
  categories: Category[]
  budget?: {
    id: string
    categoryId: string
    periodType: string
    periodStart: Date
    amountCents: number
    carryoverEnabled: boolean
  }
  onSuccess?: () => void
}

export function BudgetForm({ categories, budget, onSuccess }: BudgetFormProps) {
  const router = useRouter()
  const isEdit = !!budget
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [amountRaw, setAmountRaw] = useState(isEdit ? (budget.amountCents / 100).toFixed(2) : '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(budget?.categoryId ?? '')
  const [selectedPeriodType, setSelectedPeriodType] = useState<CreateBudgetInput['periodType']>(
    (budget?.periodType as CreateBudgetInput['periodType']) ?? 'monthly'
  )
  const [carryover, setCarryover] = useState(budget?.carryoverEnabled ?? false)

  const now = new Date()
  const defaultPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema) as Resolver<CreateBudgetInput>,
    defaultValues: {
      categoryId: budget?.categoryId ?? '',
      periodType: (budget?.periodType as CreateBudgetInput['periodType']) ?? 'monthly',
      periodStart: budget?.periodStart ?? defaultPeriodStart,
      amountCents: budget?.amountCents ?? 0,
      carryoverEnabled: budget?.carryoverEnabled ?? false,
    },
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  async function onSubmit(values: CreateBudgetInput) {
    setLoading(true)
    setError(undefined)
    try {
      if (isEdit) {
        const result = await updateBudget({ ...values, id: budget.id })
        if (!result.success) throw new Error(result.error)
      } else {
        const result = await createBudget(values)
        if (!result.success) throw new Error(result.error)
      }
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="budget-category">Category</Label>
        <Select
          value={selectedCategoryId}
          onValueChange={(v) => {
            if (!v) return
            setSelectedCategoryId(v)
            form.setValue('categoryId', v)
          }}
        >
          <SelectTrigger id="budget-category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-400">
                No expense categories yet. Create categories first.
              </div>
            ) : (
              expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.categoryId && (
          <p className="text-xs text-red-600">{form.formState.errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget-amount">Monthly budget amount</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">CAD $</span>
          <Input
            id="budget-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amountRaw}
            onChange={(e) => {
              setAmountRaw(e.target.value)
              form.setValue('amountCents', parseCurrencyInput(e.target.value))
            }}
          />
        </div>
        {form.formState.errors.amountCents && (
          <p className="text-xs text-red-600">{form.formState.errors.amountCents.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget-period-type">Period</Label>
        <Select
          value={selectedPeriodType}
          onValueChange={(v) => {
            if (!v) return
            const typed = v as CreateBudgetInput['periodType']
            setSelectedPeriodType(typed)
            form.setValue('periodType', typed)
          }}
        >
          <SelectTrigger id="budget-period-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="biweekly">Bi-weekly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget-period-start">Period start</Label>
        <Input
          id="budget-period-start"
          type="date"
          defaultValue={toDateInputValue(budget?.periodStart ?? defaultPeriodStart)}
          onChange={(e) => {
            const d = new Date(e.target.value + 'T00:00:00')
            if (!isNaN(d.getTime())) form.setValue('periodStart', d)
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="budget-carryover"
          type="checkbox"
          className="rounded border-neutral-300"
          checked={carryover}
          onChange={(e) => {
            setCarryover(e.target.checked)
            form.setValue('carryoverEnabled', e.target.checked)
          }}
        />
        <Label htmlFor="budget-carryover" className="text-sm font-normal text-neutral-700">
          Roll over unused budget to next period
        </Label>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading || expenseCategories.length === 0}>
        {loading ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save changes' : 'Add budget'}
      </Button>
    </form>
  )
}
