'use client'

import { useRouter } from 'next/navigation'
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
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()

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
    <header className="flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4">
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
