'use client'

import { useCallback, useEffect } from 'react'
import {
  usePlaidLink,
  type PlaidLinkOnSuccess,
  type PlaidLinkOnSuccessMetadata,
} from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { createLinkTokenAction, exchangePublicTokenAction } from '@/lib/actions/connections'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  updateConnectionId?: string
  onConnected: (connectionId: string) => void
  onError?: (error: string) => void
  children?: React.ReactNode
  // When true, this instance is re-opening Plaid Link after OAuth bank redirect
  receivedRedirectUri?: string
}

export function PlaidLinkButton({
  updateConnectionId,
  onConnected,
  onError,
  children,
  receivedRedirectUri,
}: Props) {
  const queryClient = useQueryClient()
  const redirectUri =
    typeof window !== 'undefined' ? `${window.location.origin}/plaid/oauth-return` : undefined

  const {
    data: linkToken,
    isLoading: tokenLoading,
    error: tokenError,
  } = useQuery({
    queryKey: ['plaid-link-token', updateConnectionId, !!receivedRedirectUri],
    queryFn: async () => {
      // OAuth return: reuse token stored before the redirect
      if (receivedRedirectUri) {
        const stored = sessionStorage.getItem('plaid_link_token')
        if (stored) return stored
      }
      const result = await createLinkTokenAction(updateConnectionId, redirectUri)
      if (!result.success) throw new Error(result.error)
      // Store for OAuth return page
      sessionStorage.setItem('plaid_link_token', result.data.linkToken)
      return result.data.linkToken
    },
    staleTime: 25 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (tokenError) onError?.(tokenError.message)
  }, [tokenError, onError])

  const exchange = useMutation({
    mutationFn: async (params: {
      publicToken: string
      institutionId: string
      institutionName: string
      accounts: Array<{
        externalAccountId: string
        name: string
        officialName: string | null
        mask: string | null
        type: string
        subtype: string | null
      }>
    }) => {
      const result = await exchangePublicTokenAction(params)
      if (!result.success) throw new Error(result.error)
      sessionStorage.removeItem('plaid_link_token')
      return result.data.connectionId
    },
    onSuccess: onConnected,
    onError: (err) => onError?.(err.message),
  })

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      exchange.mutate({
        publicToken,
        institutionId: metadata.institution?.institution_id ?? '',
        institutionName: metadata.institution?.name ?? '',
        accounts: (metadata.accounts ?? []).map((a) => ({
          externalAccountId: a.id,
          name: a.name,
          officialName: a.name,
          mask: a.mask,
          type: a.type,
          subtype: a.subtype,
        })),
      })
    },
    [exchange]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken ?? null,
    onSuccess,
    receivedRedirectUri: receivedRedirectUri ?? undefined,
    onExit: (err) => {
      if (err) onError?.(err.display_message ?? 'Connection cancelled')
    },
  })

  // Auto-open when returning from OAuth redirect
  useEffect(() => {
    if (receivedRedirectUri && ready) open()
  }, [receivedRedirectUri, ready, open])

  if (tokenError) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          queryClient.invalidateQueries({ queryKey: ['plaid-link-token', updateConnectionId] })
        }
        className="w-full"
      >
        Retry connection
      </Button>
    )
  }

  const isLoading = tokenLoading || exchange.isPending || !ready

  if (receivedRedirectUri) {
    // In OAuth return mode — don't render a button, just complete automatically
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
        <span>Completing bank connection...</span>
      </div>
    )
  }

  return (
    <Button onClick={() => open()} disabled={isLoading || !linkToken} className="w-full">
      {isLoading ? 'Loading…' : (children ?? 'Connect bank account')}
    </Button>
  )
}
