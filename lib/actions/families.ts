'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { DEFAULT_CATEGORIES } from '@/lib/data/default-categories'
import { getSession, writeAuditLog } from './utils'
import { createFamilySchema, inviteMemberSchema } from '@/lib/validations/schemas'
import type { ActionResult } from './utils'

export async function createFamily(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const parsed = createFamilySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const org = await auth.api.createOrganization({
    headers: await headers(),
    body: { name: parsed.data.name, slug: parsed.data.name.toLowerCase().replace(/\s+/g, '-') },
  })

  await seedDefaultCategories(org.id)
  await writeAuditLog({
    familyId: org.id,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'family',
    resourceId: org.id,
    newValue: { name: parsed.data.name },
  })

  return { success: true, data: { id: org.id } }
}

export async function getFamilies() {
  const orgs = await auth.api.listOrganizations({ headers: await headers() })
  return orgs ?? []
}

export async function getActiveFamily() {
  const orgs = await auth.api.listOrganizations({ headers: await headers() })
  return orgs?.[0] ?? null
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

  await auth.api.createInvitation({
    headers: await headers(),
    body: {
      organizationId: familyId,
      email: parsed.data.email,
      role: parsed.data.role,
    },
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

  await db.insert(categories).values(rows)
}
