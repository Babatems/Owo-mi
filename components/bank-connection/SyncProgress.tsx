'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { getConnectionsAction } from '@/lib/actions/connections'

type Props = {
  connectionId: string
  onComplete?: () => void
}

type Step = { label: string; done: boolean }

export function SyncProgress({ connectionId, onComplete }: Props) {
  const router = useRouter()
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Connected', done: true },
    { label: 'Importing transactions', done: false },
    { label: 'Done', done: false },
  ])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (finished) return
    const interval = setInterval(async () => {
      const result = await getConnectionsAction()
      if (!result.success) return

      const conn = result.data.find((c) => c.id === connectionId)
      if (!conn) return

      if (conn.status === 'active') {
        setSteps([
          { label: 'Connected', done: true },
          { label: 'Importing transactions', done: true },
          { label: 'Done', done: true },
        ])
        setFinished(true)
        clearInterval(interval)
        router.refresh()
        setTimeout(() => onComplete?.(), 800)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [connectionId, finished, onComplete, router])

  return (
    <div className="space-y-4">
      <p className="font-medium text-neutral-900 dark:text-white">Syncing your accounts</p>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <Loader2 className="size-5 animate-spin text-neutral-400" />
            )}
            <span
              className={
                step.done
                  ? 'text-sm text-neutral-900 dark:text-white'
                  : 'text-sm text-neutral-400 dark:text-neutral-500'
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {finished && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Connected ✓ — Your transactions are syncing now. We&apos;ll refresh daily, automatically.
        </p>
      )}
    </div>
  )
}
