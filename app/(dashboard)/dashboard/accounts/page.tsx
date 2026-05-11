import { Suspense } from 'react'
import { getAccounts } from '@/lib/actions/accounts'
import { AccountCard } from '@/components/accounts/account-card'
import { AccountForm } from '@/components/accounts/account-form'
import { ConnectBankButton } from '@/components/bank-connection/ConnectBankButton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

async function AccountsList() {
  const accounts = await getAccounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Accounts</h1>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectBankButton />
          <Dialog>
            <DialogTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <Plus className="size-4" />
              Add manually
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Add account</DialogTitle>
              </DialogHeader>
              <AccountForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No accounts yet.</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Add your first account to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <AccountsList />
    </Suspense>
  )
}
