'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import {
  createAccountSchema,
  updateAccountSchema,
  accountTypes,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/lib/validations/schemas'
import { createAccount, updateAccount } from '@/lib/actions/accounts'
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

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Chequing',
  savings: 'Savings',
  credit: 'Credit Card',
  tfsa: 'TFSA',
  rrsp: 'RRSP',
  fhsa: 'FHSA',
  resp: 'RESP',
  investment: 'Investment',
  cash: 'Cash',
}

type AccountData = {
  id: string
  name: string
  type: string
  balanceCents: number
  currency: string
  institution: string | null
  last4?: string | null
  notes?: string | null
}

interface AccountFormProps {
  account?: AccountData
  onSuccess?: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const isEdit = !!account
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [balanceRaw, setBalanceRaw] = useState(
    isEdit ? (Math.abs(account.balanceCents) / 100).toFixed(2) : ''
  )

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema) as Resolver<CreateAccountInput>,
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as CreateAccountInput['type']) ?? 'checking',
      balanceCents: account?.balanceCents ?? 0,
      currency: account?.currency ?? 'CAD',
      institution: account?.institution ?? '',
      last4: account?.last4 ?? '',
    },
  })

  async function onSubmit(values: CreateAccountInput) {
    setLoading(true)
    setError(undefined)
    try {
      if (isEdit) {
        const payload: UpdateAccountInput = { ...values, id: account.id }
        const result = await updateAccount(payload)
        if (!result.success) throw new Error(result.error)
      } else {
        const result = await createAccount(values)
        if (!result.success) throw new Error(result.error)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="acc-name">Account name</Label>
        <Input id="acc-name" placeholder="e.g. RBC Chequing" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acc-type">Account type</Label>
        <Select
          value={form.watch('type')}
          onValueChange={(v) => form.setValue('type', v as CreateAccountInput['type'])}
        >
          <SelectTrigger id="acc-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accountTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {ACCOUNT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acc-balance">Current balance</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">CAD</span>
          <Input
            id="acc-balance"
            inputMode="decimal"
            placeholder="0.00"
            value={balanceRaw}
            onChange={(e) => {
              setBalanceRaw(e.target.value)
              form.setValue('balanceCents', parseCurrencyInput(e.target.value))
            }}
          />
        </div>
        <p className="text-xs text-neutral-400">Use a negative value for credit card balances.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acc-institution">Institution (optional)</Label>
        <Input
          id="acc-institution"
          placeholder="e.g. RBC, TD, Scotiabank"
          {...form.register('institution')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acc-last4">Last 4 digits (optional)</Label>
        <Input id="acc-last4" placeholder="e.g. 4321" maxLength={4} {...form.register('last4')} />
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save changes' : 'Add account'}
      </Button>
    </form>
  )
}
