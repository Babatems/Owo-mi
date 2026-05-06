'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { inviteMember } from '@/lib/actions/families'
import { inviteMemberSchema } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Controller } from 'react-hook-form'

type InviteValues = z.infer<typeof inviteMemberSchema>

export function InviteForm({ familyId }: { familyId: string }) {
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteMemberSchema) as Resolver<InviteValues>,
    defaultValues: { email: '', role: 'member' },
  })

  async function onSubmit(values: InviteValues) {
    setLoading(true)
    setError(undefined)
    setSuccess(false)
    const result = await inviteMember(familyId, values)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setSuccess(true)
      form.reset()
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="invite-email" className="text-xs">
            Email address
          </Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="partner@example.com"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="w-28 space-y-1">
          <Label className="text-xs">Role</Label>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <span className="text-sm capitalize">{field.value}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-600">
          Invitation sent! They&apos;ll receive an email shortly.
        </p>
      )}

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}
