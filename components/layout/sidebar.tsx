'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'accounts', href: '/dashboard/accounts', icon: CreditCard },
  { key: 'transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { key: 'budgets', href: '/dashboard/budgets', icon: PieChart },
  { key: 'goals', href: '/dashboard/goals', icon: Target },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('sidebar')

  return (
    <aside className="flex h-full w-56 flex-col border-r border-neutral-200 bg-white px-3 py-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-6 px-2">
        <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
          Owó-mi
        </span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
          const active =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(key)}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
