import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')
  // The (dashboard) group renders at '/' — but since this page IS at '/',
  // we just need the dashboard layout to wrap it. Move the content here
  // so the redirect loop is avoided.
  redirect('/accounts')
}
