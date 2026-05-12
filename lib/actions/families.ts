'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { categories } from '@/lib/db/schema'
import { member as memberTable, organization as orgTable } from '@/lib/db/auth-schema'
import { DEFAULT_CATEGORIES } from '@/lib/data/default-categories'
import { getSession, withFamilyContext, writeAuditLog } from './utils'
import { createFamilySchema, inviteMemberSchema } from '@/lib/validations/schemas'
import type { ActionResult } from './utils'
import { resend, EMAIL_FROM } from '@/lib/email'
import { invitationEmailHtml } from '@/lib/email/templates'

export async function createFamily(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const parsed = createFamilySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  let org: { id: string }
  try {
    org = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name: parsed.data.name,
        slug:
          parsed.data.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-') +
          '-' +
          Date.now(),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create household'
    return { success: false, error: msg }
  }

  await withFamilyContext(org.id, () => seedDefaultCategories(org.id)).catch(() => {})
  await writeAuditLog({
    familyId: org.id,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'family',
    resourceId: org.id,
    newValue: { name: parsed.data.name },
  }).catch(() => {})

  return { success: true, data: { id: org.id } }
}

export async function getFamilies() {
  try {
    const session = await getSession()
    return db
      .select({
        id: orgTable.id,
        name: orgTable.name,
        slug: orgTable.slug,
        logo: orgTable.logo,
        createdAt: orgTable.createdAt,
        metadata: orgTable.metadata,
      })
      .from(memberTable)
      .innerJoin(orgTable, eq(memberTable.organizationId, orgTable.id))
      .where(eq(memberTable.userId, session.user.id))
  } catch {
    return []
  }
}

export async function getActiveFamily() {
  try {
    const session = await getSession()
    const rows = await db
      .select({
        id: orgTable.id,
        name: orgTable.name,
        slug: orgTable.slug,
        logo: orgTable.logo,
        createdAt: orgTable.createdAt,
        metadata: orgTable.metadata,
      })
      .from(memberTable)
      .innerJoin(orgTable, eq(memberTable.organizationId, orgTable.id))
      .where(eq(memberTable.userId, session.user.id))
      .limit(1)
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getFamilyMembers(familyId: string) {
  const members = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: familyId },
  })
  return members?.members ?? []
}

export async function inviteMember(familyId: string, input: unknown): Promise<ActionResult<void>> {
  const session = await getSession()
  const parsed = inviteMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  if (session.user.email.toLowerCase() === parsed.data.email.toLowerCase()) {
    return { success: false, error: 'You cannot invite yourself.' }
  }

  const invitation = await auth.api.createInvitation({
    headers: await headers(),
    body: {
      organizationId: familyId,
      email: parsed.data.email,
      role: parsed.data.role,
    },
  })

  const family = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: familyId },
  })

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${invitation.id}`
  await resend.emails.send({
    from: EMAIL_FROM,
    to: parsed.data.email,
    subject: `${session.user.name} invited you to join their family on Owó-mi`,
    html: invitationEmailHtml({
      inviterName: session.user.name,
      orgName: family?.name ?? 'their family',
      url: acceptUrl,
    }),
  })

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'invitation',
    newValue: { email: parsed.data.email, role: parsed.data.role },
  })

  return { success: true, data: undefined }
}

export async function acceptInvitation(invitationId: string): Promise<ActionResult<void>> {
  await auth.api.acceptInvitation({
    headers: await headers(),
    body: { invitationId },
  })
  return { success: true, data: undefined }
}

async function seedDefaultCategories(familyId: string) {
  const rows: (typeof categories.$inferInsert)[] = []

  for (const cat of DEFAULT_CATEGORIES) {
    const parentId = crypto.randomUUID()
    rows.push({
      id: parentId,
      familyId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isSystem: true,
    })
    for (const child of cat.children ?? []) {
      rows.push({
        id: crypto.randomUUID(),
        familyId,
        parentId,
        name: child.name,
        icon: child.icon,
        color: child.color,
        type: child.type,
        isSystem: true,
      })
    }
  }

  if (rows.length > 0) {
    await db.insert(categories).values(rows)
  }
}
