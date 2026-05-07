'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { SignOutOverlay } from '@/components/auth/sign-out-overlay'

export function SignOutButton() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await authClient.signOut()
    router.push('/en')
  }

  return (
    <>
      <SignOutOverlay visible={signingOut} />
      <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
        <LogOut className="mr-2 size-4" />
        Sign out
      </Button>
    </>
  )
}
