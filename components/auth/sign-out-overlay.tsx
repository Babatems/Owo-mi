'use client'

import { Loader2 } from 'lucide-react'

export function SignOutOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-12 py-8 shadow-2xl dark:bg-neutral-900">
        <Loader2 className="size-8 animate-spin text-neutral-400 dark:text-neutral-500" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Signing out</p>
      </div>
    </div>
  )
}
