import { Suspense } from 'react'
import { getAccounts } from '@/lib/actions/accounts'
import { ImportWizard } from '@/components/import/import-wizard'
import { Skeleton } from '@/components/ui/skeleton'

async function ImportPage() {
  const accounts = await getAccounts()
  const accountsMini = accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))

  return <ImportWizard accounts={accountsMini} />
}

export default function TransactionsImportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <ImportPage />
    </Suspense>
  )
}
