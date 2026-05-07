'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import {
  createAccountSchema,
  accountTypes,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/lib/validations/schemas'
import { createAccount, updateAccount } from '@/lib/actions/accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { parseCurrencyInput } from '@/lib/utils/currency'

const REGISTERED_TYPES = new Set(['tfsa', 'rrsp', 'fhsa', 'resp'])

const REGISTERED_ROOM_LABELS: Record<string, string> = {
  tfsa: 'Contribution room remaining (from CRA My Account)',
  rrsp: 'RRSP deduction limit (from Notice of Assessment)',
  fhsa: 'Annual contribution room remaining',
  resp: 'Remaining room before $50,000 lifetime limit',
}

const REGISTERED_ROOM_HINTS: Record<string, string> = {
  tfsa: '2026 annual limit: $7,000 · Cumulative: $109,000',
  rrsp: '2026 annual limit: $33,810 (or 18% of 2025 earned income, whichever is less)',
  fhsa: '2026 annual limit: $8,000 · Lifetime limit: $40,000',
  resp: '$50,000 lifetime limit per beneficiary',
}

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
  contributionRoomCents?: number | null
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
  const [roomRaw, setRoomRaw] = useState(
    isEdit && account.contributionRoomCents != null
      ? (account.contributionRoomCents / 100).toFixed(2)
      : ''
  )

  const [selectedType, setSelectedType] = useState<string>(account?.type ?? 'checking')

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema) as Resolver<CreateAccountInput>,
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as CreateAccountInput['type']) ?? 'checking',
      balanceCents: account?.balanceCents ?? 0,
      currency: account?.currency ?? 'CAD',
      institution: account?.institution ?? '',
      last4: account?.last4 ?? '',
      contributionRoomCents: account?.contributionRoomCents ?? undefined,
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
          value={selectedType}
          onValueChange={(v) => {
            if (!v) return
            setSelectedType(v)
            form.setValue('type', v as CreateAccountInput['type'])
          }}
        >
          <SelectTrigger id="acc-type">
            <span className="flex flex-1 text-left text-sm">
              {ACCOUNT_TYPE_LABELS[selectedType] ?? selectedType}
            </span>
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

      {REGISTERED_TYPES.has(selectedType) && (
        <div className="space-y-1.5 rounded-lg border border-violet-100 bg-violet-50 p-3">
          <Label htmlFor="acc-room" className="text-violet-800">
            {REGISTERED_ROOM_LABELS[selectedType] ?? 'Contribution room remaining'}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-violet-500">CAD $</span>
            <Input
              id="acc-room"
              inputMode="decimal"
              placeholder="0.00"
              value={roomRaw}
              onChange={(e) => {
                setRoomRaw(e.target.value)
                const cents = parseCurrencyInput(e.target.value)
                form.setValue('contributionRoomCents', cents > 0 ? cents : undefined)
              }}
              className="border-violet-200 bg-white"
            />
          </div>
          {REGISTERED_ROOM_HINTS[selectedType] && (
            <p className="text-xs text-violet-600">{REGISTERED_ROOM_HINTS[selectedType]}</p>
          )}
        </div>
      )}

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save changes' : 'Add account'}
      </Button>
    </form>
  )
}
