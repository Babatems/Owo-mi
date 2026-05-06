'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auditLog } from '@/lib/db/schema'

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getActiveFamilyId(): Promise<string> {
  const session = await getSession()
  const orgs = await auth.api.listOrganizations({ headers: await headers() })
  const org = orgs?.[0]
  if (!org) throw new Error('No family found. Please create or join a family first.')
  return org.id
}

export async function withFamilyContext<T>(familyId: string, fn: () => Promise<T>): Promise<T> {
  await db.execute(sql`SET LOCAL app.current_family = ${familyId}`)
  return fn()
}

export async function writeAuditLog({
  familyId,
  userId,
  action,
  resourceType,
  resourceId,
  oldValue,
  newValue,
}: {
  familyId: string
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT'
  resourceType: string
  resourceId?: string
  oldValue?: unknown
  newValue?: unknown
}) {
  const headersList = await headers()
  await db.insert(auditLog).values({
    familyId,
    userId,
    action,
    resourceType,
    resourceId,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    ipAddress: headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip'),
    userAgent: headersList.get('user-agent'),
  })
}
