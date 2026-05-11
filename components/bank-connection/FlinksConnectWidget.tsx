'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { exchangeLoginIdAction } from '@/lib/actions/connections'

type Props = {
  onConnected: (connectionId: string) => void
  onError?: (error: string) => void
}

type FlinksMessage = {
  step?: string
  loginId?: string
  institution?: string
  [key: string]: unknown
}

export function FlinksConnectWidget({ onConnected, onError }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [exchanging, setExchanging] = useState(false)

  const isSandbox = process.env.NEXT_PUBLIC_FLINKS_ENV !== 'production'
  const instance = process.env.NEXT_PUBLIC_FLINKS_INSTANCE ?? (isSandbox ? 'toolbox-sandbox' : '')
  const connectUrl = `https://${instance}.connect.flinks.com/?innerRedirect=true`

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      // Only accept messages from the Flinks iframe origin
      if (!event.origin.includes('flinks.com')) return

      let data: FlinksMessage
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }

      if (data.step === 'REDIRECT' && data.loginId) {
        setExchanging(true)
        try {
          const institutionName = data.institution ?? 'Canadian Bank'
          const result = await exchangeLoginIdAction({ loginId: data.loginId, institutionName })
          if (!result.success) throw new Error(result.error)
          onConnected(result.data.connectionId)
        } catch (err) {
          onError?.(err instanceof Error ? err.message : 'Failed to connect')
          setExchanging(false)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onConnected, onError])

  return (
    <div className="relative flex min-h-[500px] flex-col">
      {(loading || exchanging) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-neutral-900/80">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-5 animate-spin text-neutral-400" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {exchanging ? 'Connecting your account…' : 'Loading Flinks Connect…'}
            </span>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={connectUrl}
        className="flex-1 rounded-lg border-0"
        style={{ minHeight: 500 }}
        onLoad={() => setLoading(false)}
        allow="camera"
        title="Flinks Connect"
      />
    </div>
  )
}
