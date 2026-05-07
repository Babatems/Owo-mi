'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-medium text-neutral-900">
        Something went wrong loading the dashboard.
      </p>
      <p className="mt-1 text-xs text-neutral-400">{error.message}</p>
      <Button size="sm" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
