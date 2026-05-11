'use client'

import { AlertCircle, CheckCircle2, Clock, RefreshCw, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status =
  | 'pending'
  | 'active'
  | 'login_required'
  | 'permission_revoked'
  | 'expired'
  | 'error'
  | 'disconnected'

const statusConfig: Record<Status, { label: string; icon: React.ElementType; className: string }> =
  {
    active: {
      label: 'Synced',
      icon: CheckCircle2,
      className: 'text-green-600 dark:text-green-400',
    },
    pending: {
      label: 'Connecting…',
      icon: RefreshCw,
      className: 'text-blue-500 dark:text-blue-400',
    },
    login_required: {
      label: 'Reconnect required',
      icon: AlertCircle,
      className: 'text-amber-600 dark:text-amber-400',
    },
    permission_revoked: {
      label: 'Access revoked',
      icon: WifiOff,
      className: 'text-red-600 dark:text-red-400',
    },
    expired: { label: 'Expired', icon: Clock, className: 'text-amber-600 dark:text-amber-400' },
    error: { label: 'Sync error', icon: AlertCircle, className: 'text-red-600 dark:text-red-400' },
    disconnected: {
      label: 'Disconnected',
      icon: WifiOff,
      className: 'text-neutral-400 dark:text-neutral-500',
    },
  }

export function ConnectionStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? statusConfig.error
  const Icon = config.icon

  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', config.className)}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  )
}
