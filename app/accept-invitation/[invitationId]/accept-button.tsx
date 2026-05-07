'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvitation } from '@/lib/actions/families'

export function AcceptButton({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function handleAccept() {
    setLoading(true)
    setError(undefined)
    const result = await acceptInvitation(invitationId)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error ?? 'Failed to accept invitation.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: 'var(--brand)' }}
      >
        {loading ? 'Accepting…' : 'Accept invitation'}
      </button>
    </div>
  )
}
