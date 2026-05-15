'use client'

import Link from 'next/link'
import { Upload } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ImportTransactionButton() {
  return (
    <Link
      href="/dashboard/transactions/import"
      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1.5')}
    >
      <Upload className="size-4" />
      Import
    </Link>
  )
}
