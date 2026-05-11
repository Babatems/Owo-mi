'use client'

import { Link2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ConnectBankButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-not-allowed" />}>
          <span
            className={cn(
              buttonVariants({ size: 'sm' }),
              'pointer-events-none cursor-not-allowed gap-1.5 opacity-50',
              'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
              'border border-neutral-300 dark:border-neutral-600',
              '[background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_5px)]'
            )}
          >
            <Link2 className="size-4" />
            Connect bank
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Coming soon</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
