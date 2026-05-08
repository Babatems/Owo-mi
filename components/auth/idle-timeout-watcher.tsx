'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/client'
import { useIdleTimeout } from '@/lib/hooks/use-idle-timeout'
import { SignOutOverlay } from './sign-out-overlay'

const TOAST_ID = 'idle-warn'

export function IdleTimeoutWatcher() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleWarn = useCallback(() => {
    toast('Are you still there? 👀', {
      id: TOAST_ID,
      description: "You'll be signed out in 2 minutes due to inactivity.",
      duration: 120_000,
    })
  }, [])

  const handleActivity = useCallback(() => {
    toast.dismiss(TOAST_ID)
  }, [])

  const handleTimeout = useCallback(async () => {
    toast.dismiss(TOAST_ID)
    setSigningOut(true)
    await authClient.signOut()
    router.push('/en')
  }, [router])

  useIdleTimeout({
    onWarn: handleWarn,
    onTimeout: handleTimeout,
    onActivity: handleActivity,
  })

  return <SignOutOverlay visible={signingOut} />
}
