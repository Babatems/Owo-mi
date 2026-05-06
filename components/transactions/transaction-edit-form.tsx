'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { updateTransactionSchema, type UpdateTransactionInput } from '@/lib/validations/schemas'
import { updateTransaction } from '@/lib/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { CategoryCombobox } from '@/components/categories/category-combobox'
import { parseCurrencyInput } from '@/lib/utils/currency'
import { toDateInputValue } from '@/lib/utils/dates'
import type { CategoryTree } from '@/lib/actions/categories'

type Account = { id: string; name: string; type: string }

type ExistingTx = {
  id: string
  accountId: string
  amountCents: number
  currency: string
  date: Date
  description: string
  categoryId?: string | null
  notes?: string | null
}

interface TransactionEditFormProps {
  tx: ExistingTx
  accounts: Account[]
  categories: CategoryTree[]
  onSuccess?: () => void
}

export function TransactionEditForm({
  tx,
  accounts,
  categories,
  onSuccess,
}: TransactionEditFormProps) {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [isExpense, setIsExpense] = useState(tx.amountCents < 0)
  const [amountRaw, setAmountRaw] = useState((Math.abs(tx.amountCents) / 100).toFixed(2))

  const form = useForm<UpdateTransactionInput>({
    resolver: zodResolver(updateTransactionSchema) as Resolver<UpdateTransactionInput>,
    defaultValues: {
      id: tx.id,
      accountId: tx.accountId,
      amountCents: Math.abs(tx.amountCents),
      currency: tx.currency,
      date: new Date(tx.date),
      description: tx.description,
      categoryId: tx.categoryId ?? undefined,
      notes: tx.notes ?? undefined,
    },
  })

  async function onSubmit(values: UpdateTransactionInput) {
    setLoading(true)
    setError(undefined)
    try {
      const finalAmount = isExpense
        ? -Math.abs(values.amountCents ?? 0)
        : Math.abs(values.amountCents ?? 0)
      const result = await updateTransaction({ ...values, amountCents: finalAmount })
      if (!result.success) throw new Error(result.error)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Expense / Income toggle */}
      <div className="flex overflow-hidden rounded-md border border-neutral-200 text-sm">
        <button
          type="button"
          onClick={() => setIsExpense(true)}
          className={`flex-1 py-1.5 text-center transition-colors ${
            isExpense
              ? 'bg-red-50 font-medium text-red-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setIsExpense(false)}
          className={`flex-1 py-1.5 text-center transition-colors ${
            !isExpense
              ? 'bg-emerald-50 font-medium text-emerald-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Income
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-amount">Amount (CAD)</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">{isExpense ? '−' : '+'}</span>
          <Input
            id="edit-amount"
            inputMode="decimal"
            value={amountRaw}
            onChange={(e) => {
              setAmountRaw(e.target.value)
              form.setValue('amountCents', parseCurrencyInput(e.target.value))
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-date">Date</Label>
        <Input
          id="edit-date"
          type="date"
          defaultValue={toDateInputValue(new Date(tx.date))}
          onChange={(e) => form.setValue('date', new Date(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-desc">Description</Label>
        <Input id="edit-desc" {...form.register('description')} />
        {form.formState.errors.description && (
          <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Account</Label>
        <Controller
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm">
                  {accounts.find((a) => a.id === field.value)?.name ?? (
                    <span className="text-neutral-400">Select account</span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <CategoryCombobox
              categories={categories}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Notes (optional)</Label>
        <Textarea id="edit-notes" rows={2} {...form.register('notes')} />
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
