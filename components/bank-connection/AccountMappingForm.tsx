'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAccountMappingAction } from '@/lib/actions/connections'
import type { ConnectionWithAccounts } from '@/lib/actions/connections'

type ExistingAccount = { id: string; name: string; type: string }

type Props = {
  connectionId: string
  bankAccounts: ConnectionWithAccounts['bankAccounts']
  existingAccounts: ExistingAccount[]
  onComplete: () => void
}

type MappingChoice = {
  action: 'existing' | 'create' | 'skip'
  userAccountId?: string
  newName?: string
  newType?: string
}

export function AccountMappingForm({ bankAccounts, existingAccounts, onComplete }: Props) {
  const [mappings, setMappings] = useState<Record<string, MappingChoice>>(
    Object.fromEntries(
      bankAccounts.map((a) => [a.id, { action: 'create', newName: a.name, newType: a.type }])
    )
  )

  const save = useMutation({
    mutationFn: async () => {
      for (const [bankAccountId, choice] of Object.entries(mappings)) {
        if (choice.action === 'skip') continue
        const result = await createAccountMappingAction({
          bankAccountId,
          userAccountId: choice.action === 'existing' ? choice.userAccountId : undefined,
          newAccountName: choice.action === 'create' ? choice.newName : undefined,
          newAccountType: choice.action === 'create' ? choice.newType : undefined,
        })
        if (!result.success) throw new Error(result.error)
      }
    },
    onSuccess: onComplete,
  })

  function update(bankAccountId: string, patch: Partial<MappingChoice>) {
    setMappings((prev) => ({ ...prev, [bankAccountId]: { ...prev[bankAccountId], ...patch } }))
  }

  return (
    <div className="flex flex-col gap-6 pb-1">
      <div>
        <p className="font-medium text-neutral-900 dark:text-white">Map your accounts</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Choose which Owo-mi account each connected account should appear under.
        </p>
      </div>

      <div className="space-y-4">
        {bankAccounts.map((ba) => {
          const choice = mappings[ba.id] ?? { action: 'skip' }
          return (
            <div
              key={ba.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{ba.name}</p>
                  {ba.mask && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">•••• {ba.mask}</p>
                  )}
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 capitalize dark:bg-neutral-800 dark:text-neutral-300">
                  {ba.type}
                </span>
              </div>

              <div className="space-y-3">
                <Select
                  value={choice.action}
                  onValueChange={(v) => update(ba.id, { action: v as MappingChoice['action'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create new account</SelectItem>
                    <SelectItem value="existing">Add to existing account</SelectItem>
                    <SelectItem value="skip">Skip this account</SelectItem>
                  </SelectContent>
                </Select>

                {choice.action === 'create' && (
                  <Input
                    placeholder="Account name"
                    value={choice.newName ?? ba.name}
                    onChange={(e) => update(ba.id, { newName: e.target.value })}
                  />
                )}

                {choice.action === 'existing' && (
                  <Select
                    value={choice.userAccountId ?? ''}
                    onValueChange={(v) => update(ba.id, { userAccountId: v ?? undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account…" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {save.error && <p className="text-sm text-red-600">{save.error.message}</p>}

      <div className="sticky bottom-0 bg-white pt-2 dark:bg-neutral-950">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending ? 'Saving…' : 'Save and sync'}
        </Button>
      </div>
    </div>
  )
}
