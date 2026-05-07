import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth/server'
import { AcceptButton } from './accept-button'

type Props = {
  params: Promise<{ invitationId: string }>
}

export default async function AcceptInvitationPage({ params }: Props) {
  const { invitationId } = await params
  const hdrs = await headers()

  type InvitationData = {
    id: string
    email: string
    organizationName: string
    inviterEmail: string
    status: string
  }

  let invitation: InvitationData | null = null

  try {
    const result = await auth.api.getInvitation({
      headers: hdrs,
      query: { id: invitationId },
    })
    invitation = result as unknown as InvitationData
  } catch {
    invitation = null
  }

  const session = await auth.api.getSession({ headers: hdrs })

  if (!invitation) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-2xl">🔗</p>
        <h1 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
          Invitation not found
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          This invitation may have expired or already been accepted.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-2xl">✓</p>
        <h1 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">
          Invitation already used
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          This invitation has already been accepted or cancelled.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Go to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 text-center">
        <p className="text-3xl">🏠</p>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-white">
          You&apos;ve been invited
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {invitation.inviterEmail}
          </span>{' '}
          invited you to join{' '}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {invitation.organizationName}
          </span>{' '}
          on Owó-mi.
        </p>
      </div>

      {session?.user ? (
        <AcceptButton invitationId={invitationId} />
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Sign in or create an account to accept this invitation.
          </p>
          <Link
            href={`/sign-in?next=/accept-invitation/${invitationId}`}
            className="block w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            Sign in
          </Link>
          <Link
            href={`/sign-up?next=/accept-invitation/${invitationId}`}
            className="block w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Create an account
          </Link>
        </div>
      )}
    </div>
  )
}
