'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PlaidLinkButton } from '@/components/bank-connection/PlaidLinkButton'

export default function PlaidOAuthReturn() {
  const router = useRouter()
  const [receivedRedirectUri] = useState<string | undefined>(() =>
    typeof window !== 'undefined' ? window.location.href : undefined
  )

  function handleConnected(connectionId: string) {
    // Store connectionId so ConnectBankButton can resume the wizard at mapping step
    sessionStorage.setItem('plaid_oauth_connection', connectionId)
    router.push('/dashboard/accounts')
  }

  function handleError(err: string) {
    console.error('Plaid OAuth return error:', err)
    router.push('/dashboard/accounts')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="size-6 animate-spin text-neutral-400" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Completing bank connection…</p>
      {receivedRedirectUri && (
        <PlaidLinkButton
          receivedRedirectUri={receivedRedirectUri}
          onConnected={handleConnected}
          onError={handleError}
        />
      )}
    </div>
  )
}
