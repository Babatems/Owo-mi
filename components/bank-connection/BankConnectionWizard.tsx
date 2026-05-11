'use client'

import { useEffect, useState } from 'react'
import { Shield, Lock, Eye } from 'lucide-react'
import { PlaidLinkButton } from './PlaidLinkButton'
import { FlinksConnectWidget } from './FlinksConnectWidget'
import { AccountMappingForm } from './AccountMappingForm'
import { SyncProgress } from './SyncProgress'
import {
  getConnectionsAction,
  startBankSyncAction,
  startFlinksSyncAction,
  type ConnectionWithAccounts,
} from '@/lib/actions/connections'

type ExistingAccount = { id: string; name: string; type: string }

type Props = {
  existingAccounts: ExistingAccount[]
  onComplete: () => void
  initialConnectionId?: string // provided when returning from Plaid OAuth redirect
}

type Step = 'provider' | 'trust' | 'flinks' | 'mapping' | 'progress' | 'done'
type Provider = 'flinks' | 'plaid'

export function BankConnectionWizard({ existingAccounts, onComplete, initialConnectionId }: Props) {
  const [step, setStep] = useState<Step>(initialConnectionId ? 'mapping' : 'provider')
  const [provider, setProvider] = useState<Provider>('flinks')
  const [connectionId, setConnectionId] = useState<string | undefined>(initialConnectionId)
  const [bankAccounts, setBankAccounts] = useState<ConnectionWithAccounts['bankAccounts']>([])
  const [error, setError] = useState<string>()

  // When resuming from OAuth return, load bank accounts and detect provider
  useEffect(() => {
    if (initialConnectionId) {
      getConnectionsAction().then((result) => {
        if (result.success) {
          const conn = result.data.find((c) => c.id === initialConnectionId)
          if (conn) {
            setBankAccounts(conn.bankAccounts)
            setProvider(conn.provider === 'flinks' ? 'flinks' : 'plaid')
          }
        }
      })
    }
  }, [initialConnectionId])

  async function handleConnected(connId: string) {
    setConnectionId(connId)
    const result = await getConnectionsAction()
    if (result.success) {
      const conn = result.data.find((c) => c.id === connId)
      if (conn) setBankAccounts(conn.bankAccounts)
    }
    setStep('mapping')
  }

  // ── Provider selection ────────────────────────────────────────────────────────

  if (step === 'provider') {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900 dark:text-white">Connect your bank</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Choose how to connect. Flinks is recommended for Canadian banks and credit unions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              setProvider('flinks')
              setStep('flinks')
            }}
            className="flex items-start gap-4 rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg dark:bg-blue-900/30">
              🍁
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                Flinks{' '}
                <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-normal text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Recommended
                </span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Best coverage for Canadian banks including credit unions, Big 6, and Quebec
                institutions.
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setProvider('plaid')
              setStep('trust')
            }}
            className="flex items-start gap-4 rounded-lg border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg dark:bg-neutral-800">
              🏦
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Plaid</p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Major banks — RBC, TD, Scotiabank, BMO, CIBC, and more.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Flinks connect ────────────────────────────────────────────────────────────

  if (step === 'flinks') {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900 dark:text-white">Connect with Flinks</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Select your bank and sign in securely. We never see your credentials.
          </p>
        </div>
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        <FlinksConnectWidget onConnected={handleConnected} onError={setError} />
      </div>
    )
  }

  // ── Plaid trust pane ─────────────────────────────────────────────────────────

  if (step === 'trust') {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900 dark:text-white">Connect your bank</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            To show your transactions in Owo-mi, we partner with Plaid – Canada&apos;s most trusted
            open-banking provider. We never see or store your bank password. Read-only access only.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: Eye,
              label: 'Read-only access',
              desc: 'We can see balances and transactions. We cannot move money.',
            },
            {
              icon: Lock,
              label: '256-bit encryption',
              desc: 'Your bank credentials never touch our servers.',
            },
            { icon: Shield, label: 'Powered by Plaid', desc: 'Trusted by millions of Canadians.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Icon className="size-4 text-neutral-600 dark:text-neutral-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{label}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <PlaidLinkButton onConnected={handleConnected} onError={setError} />
          <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
            Owo-mi will see: Account balances, Transactions (90 days+).
            <br />
            Owo-mi will NOT: Move money, change settings, or share your data.
          </p>
        </div>

        <button
          onClick={() => setStep('provider')}
          className="w-full text-center text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
        >
          Try a different connection method
        </button>
      </div>
    )
  }

  // ── Account mapping ───────────────────────────────────────────────────────────

  if (step === 'mapping' && connectionId) {
    return (
      <AccountMappingForm
        connectionId={connectionId}
        bankAccounts={bankAccounts}
        existingAccounts={existingAccounts}
        onComplete={async () => {
          if (provider === 'flinks') {
            await startFlinksSyncAction(connectionId)
          } else {
            await startBankSyncAction(connectionId)
          }
          setStep('progress')
        }}
      />
    )
  }

  // ── Sync progress ─────────────────────────────────────────────────────────────

  if (step === 'progress' && connectionId) {
    return (
      <SyncProgress
        connectionId={connectionId}
        onComplete={() => {
          setStep('done')
          setTimeout(onComplete, 500)
        }}
      />
    )
  }

  return null
}
