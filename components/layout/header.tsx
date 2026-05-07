'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { authClient, useSession } from '@/lib/auth/client'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, Sun, Moon } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  function handleThemeToggle(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`)
    document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`)
    const next = theme === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => {
      setTheme(next)
    })
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/en')
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
      {/* Mobile: hamburger + sheet */}
      <Sheet>
        <SheetTrigger
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={handleThemeToggle}
        className="flex size-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        suppressHydrationWarning
      >
        <span className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </span>
      </button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full')}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-neutral-100 text-xs text-neutral-700">
              {initials ?? '?'}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="truncate px-2 py-1.5 text-xs text-neutral-500">
            {session?.user?.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
