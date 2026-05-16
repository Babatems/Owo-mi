import { Suspense } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { getFamilyMembers, getActiveFamily } from '@/lib/actions/families'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SignOutButton } from '@/components/settings/sign-out-button'
import { InviteForm } from '@/components/settings/invite-form'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'

async function SettingsContent() {
  const [session, family] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getActiveFamily(),
  ])

  const members = family ? await getFamilyMembers(family.id) : []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Settings</h1>

      {/* Account */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Your account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {session?.user?.name?.slice(0, 2).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {session?.user?.name}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </CardContent>
      </Card>

      {/* Family */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Family — {family?.name ?? 'None'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No members found.</p>
          ) : (
            <div className="space-y-2">
              {members.map(
                (m: { id: string; role: string; user: { name?: string; email?: string } }) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-neutral-100 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          {m.user?.name?.slice(0, 2).toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                          {m.user?.name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          {m.user?.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {m.role}
                    </Badge>
                  </div>
                )
              )}
            </div>
          )}

          {family && (
            <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Invite a family member
              </p>
              <InviteForm familyId={family.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                Delete account
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Permanently removes your account and all associated data.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>

      {/* Privacy notice */}
      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Your data is stored in Canada (Montréal) and is never shared with third parties. Owó-mi
        complies with PIPEDA and Quebec Law 25.
      </p>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <SettingsContent />
    </Suspense>
  )
}
