'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createTransactionSchema, type CreateTransactionInput } from '@/lib/validations/schemas'
import { createTransaction } from '@/lib/actions/transactions'
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

interface TransactionFormProps {
  accounts: Account[]
  categories: CategoryTree[]
  onSuccess?: () => void
}

export function TransactionForm({ accounts, categories, onSuccess }: TransactionFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [amountRaw, setAmountRaw] = useState('')
  const [isExpense, setIsExpense] = useState(true)

  const form = useForm<CreateTransactionInput>({
    // Cast needed: Zod v4 coerce resolver uses input type while useForm uses output type
    resolver: zodResolver(createTransactionSchema) as Resolver<CreateTransactionInput>,
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      amountCents: 0,
      currency: 'CAD',
      date: new Date(),
      description: '',
    },
  })

  async function onSubmit(values: CreateTransactionInput) {
    setLoading(true)
    setError(undefined)
    try {
      const finalAmount = isExpense ? -Math.abs(values.amountCents) : Math.abs(values.amountCents)
      const result = await createTransaction({ ...values, amountCents: finalAmount })
      if (!result.success) throw new Error(result.error)
      router.push('/transactions')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
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

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-amount">Amount (CAD)</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">{isExpense ? '−' : '+'}</span>
          <Input
            id="tx-amount"
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

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          type="date"
          defaultValue={toDateInputValue(new Date())}
          onChange={(e) => form.setValue('date', new Date(e.target.value))}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-desc">Description</Label>
        <Input
          id="tx-desc"
          placeholder="e.g. Loblaws grocery run"
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Account */}
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

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category (optional)</Label>
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

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-notes">Notes (optional)</Label>
        <Textarea
          id="tx-notes"
          placeholder="Any additional details…"
          rows={2}
          {...form.register('notes')}
        />
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving…' : 'Add transaction'}
      </Button>
    </form>
  )
}
