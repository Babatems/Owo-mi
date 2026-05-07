'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { auditLog } from '@/lib/db/schema'
import { member as memberTable } from '@/lib/db/auth-schema'

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getActiveFamilyId(): Promise<string> {
  const session = await getSession()
  const rows = await db
    .select({ organizationId: memberTable.organizationId })
    .from(memberTable)
    .where(eq(memberTable.userId, session.user.id))
    .limit(1)
  const organizationId = rows[0]?.organizationId
  if (!organizationId) throw new Error('NO_FAMILY')
  return organizationId
}

export async function getActiveFamilyIdOrNull(): Promise<string | null> {
  try {
    return await getActiveFamilyId()
  } catch {
    return null
  }
}

export async function withFamilyContext<T>(familyId: string, fn: () => Promise<T>): Promise<T> {
  // SET LOCAL does not support parameterized values ($1) in PostgreSQL — embed directly.
  // familyId is always a UUID from Better Auth, no injection risk.
  await db.execute(sql.raw(`SET LOCAL "app.current_family" = '${familyId}'`))
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
