'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  createAccountSchema,
  accountTypes,
  type CreateAccountInput,
} from '@/lib/validations/schemas'
import { createAccount } from '@/lib/actions/accounts'
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

interface AccountFormProps {
  onSuccess?: () => void
}

export function AccountForm({ onSuccess }: AccountFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [balanceRaw, setBalanceRaw] = useState('')

  const form = useForm<CreateAccountInput>({
    // Cast needed: Zod v4 resolver infers input type while useForm uses output type
    resolver: zodResolver(createAccountSchema) as Resolver<CreateAccountInput>,
    defaultValues: {
      name: '',
      type: 'checking',
      balanceCents: 0,
      currency: 'CAD',
    },
  })

  async function onSubmit(values: CreateAccountInput) {
    setLoading(true)
    setError(undefined)
    try {
      const result = await createAccount(values)
      if (!result.success) throw new Error(result.error)
      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
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

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Adding…' : 'Add account'}
      </Button>
    </form>
  )
}
