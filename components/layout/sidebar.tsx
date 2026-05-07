'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
  { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { label: 'Budgets', href: '/dashboard/budgets', icon: PieChart },
  { label: 'Goals', href: '/dashboard/goals', icon: Target },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-neutral-200 bg-white px-3 py-4">
      <div className="mb-6 px-2">
        <span className="text-base font-semibold tracking-tight text-neutral-900">Owó-mi</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-neutral-100 font-medium text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
