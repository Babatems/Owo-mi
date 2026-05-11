'use client'

import { Upload } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ImportTransactionButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-not-allowed" />}>
          <span
            className={cn(
              buttonVariants({ size: 'sm', variant: 'outline' }),
              'pointer-events-none cursor-not-allowed gap-1.5 opacity-50',
              'border-neutral-300 bg-neutral-100 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
              '[background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.04)_4px,rgba(0,0,0,0.04)_5px)]'
            )}
          >
            <Upload className="size-4" />
            Import
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Coming soon</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
