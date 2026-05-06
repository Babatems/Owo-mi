'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFamily } from '@/lib/actions/families'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateFamilyForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      const result = await createFamily({ name })
      if (!result.success) throw new Error(result.error)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="family-name">Family name</Label>
        <Input
          id="family-name"
          placeholder="e.g. The Smith Family"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
      </div>
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading || name.length < 2}>
        {loading ? 'Creating…' : 'Create family'}
      </Button>
    </form>
  )
}
