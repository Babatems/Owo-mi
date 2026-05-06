'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await authClient.signOut()
    router.push('/sign-in')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={loading}>
      <LogOut className="mr-2 size-4" />
      {loading ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
