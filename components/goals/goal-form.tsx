'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { createSavingsGoalSchema, type CreateSavingsGoalInput } from '@/lib/validations/schemas'
import { createGoal, updateGoal } from '@/lib/actions/goals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { parseCurrencyInput } from '@/lib/utils/currency'

type Account = { id: string; name: string; type: string }

interface GoalFormProps {
  accounts: Account[]
  goal?: {
    id: string
    name: string
    targetAmountCents: number
    targetDate?: Date | null
    linkedAccountId?: string | null
  }
  onSuccess?: () => void
}

export function GoalForm({ accounts, goal, onSuccess }: GoalFormProps) {
  const router = useRouter()
  const isEdit = !!goal
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [targetRaw, setTargetRaw] = useState(
    isEdit ? (goal.targetAmountCents / 100).toFixed(2) : ''
  )
  const [selectedAccountId, setSelectedAccountId] = useState(goal?.linkedAccountId ?? '')

  const form = useForm<CreateSavingsGoalInput>({
    resolver: zodResolver(createSavingsGoalSchema) as Resolver<CreateSavingsGoalInput>,
    defaultValues: {
      name: goal?.name ?? '',
      targetAmountCents: goal?.targetAmountCents ?? 0,
      targetDate: goal?.targetDate ?? undefined,
      linkedAccountId: goal?.linkedAccountId ?? undefined,
    },
  })

  async function onSubmit(values: CreateSavingsGoalInput) {
    setLoading(true)
    setError(undefined)
    try {
      if (isEdit) {
        const result = await updateGoal({ ...values, id: goal.id })
        if (!result.success) throw new Error(result.error)
      } else {
        const result = await createGoal(values)
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

  const savingsAccounts = accounts.filter((a) =>
    ['savings', 'tfsa', 'rrsp', 'fhsa', 'resp', 'investment'].includes(a.type)
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="goal-name">Goal name</Label>
        <Input
          id="goal-name"
          placeholder="e.g. Emergency Fund, Vacation"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-target">Target amount</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">CAD $</span>
          <Input
            id="goal-target"
            inputMode="decimal"
            placeholder="0.00"
            value={targetRaw}
            onChange={(e) => {
              setTargetRaw(e.target.value)
              form.setValue('targetAmountCents', parseCurrencyInput(e.target.value))
            }}
          />
        </div>
        {form.formState.errors.targetAmountCents && (
          <p className="text-xs text-red-600">{form.formState.errors.targetAmountCents.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-date">Target date (optional)</Label>
        <Input
          id="goal-date"
          type="date"
          onChange={(e) => {
            const d = new Date(e.target.value + 'T00:00:00')
            form.setValue('targetDate', isNaN(d.getTime()) ? undefined : d)
          }}
          defaultValue={
            goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
          }
        />
      </div>

      {savingsAccounts.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="goal-account">Link to account (optional)</Label>
          <Select
            value={selectedAccountId}
            onValueChange={(v) => {
              const val = !v || v === 'none' ? undefined : v
              setSelectedAccountId(val ?? '')
              form.setValue('linkedAccountId', val)
            }}
          >
            <SelectTrigger id="goal-account">
              <span className="flex flex-1 text-left text-sm">
                {selectedAccountId ? (
                  (savingsAccounts.find((a) => a.id === selectedAccountId)?.name ?? 'None')
                ) : (
                  <span className="text-neutral-400">None</span>
                )}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {savingsAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create goal'}
      </Button>
    </form>
  )
}
