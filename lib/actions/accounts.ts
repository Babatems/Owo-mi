'use server'

import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { financialAccounts, transactions } from '@/lib/db/schema'
import { createAccountSchema, updateAccountSchema } from '@/lib/validations/schemas'
import { getSession, getActiveFamilyId, withFamilyContext, writeAuditLog } from './utils'
import type { ActionResult } from './utils'

function makeSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${base}-${id.slice(0, 6)}`
}

export async function getAccounts() {
  const familyId = await getActiveFamilyId().catch(() => null)
  if (!familyId) return []
  return withFamilyContext(familyId, () =>
    db.query.financialAccounts.findMany({
      where: and(eq(financialAccounts.familyId, familyId), isNull(financialAccounts.deletedAt)),
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  )
}

export async function getAccount(id: string) {
  const familyId = await getActiveFamilyId()
  return withFamilyContext(familyId, () =>
    db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, id),
        eq(financialAccounts.familyId, familyId),
        isNull(financialAccounts.deletedAt)
      ),
    })
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getAccountBySlug(slug: string) {
  const familyId = await getActiveFamilyId()
  const isUUID = UUID_RE.test(slug)
  return withFamilyContext(familyId, () =>
    db.query.financialAccounts.findFirst({
      where: and(
        isUUID ? eq(financialAccounts.id, slug) : eq(financialAccounts.slug, slug),
        eq(financialAccounts.familyId, familyId),
        isNull(financialAccounts.deletedAt)
      ),
    })
  )
}

export async function createAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const id = crypto.randomUUID()
  const slug = makeSlug(parsed.data.name, id)
  const [account] = await withFamilyContext(familyId, () =>
    db
      .insert(financialAccounts)
      .values({ id, ...parsed.data, familyId, slug })
      .returning({ id: financialAccounts.id })
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'financial_account',
    resourceId: account.id,
    newValue: parsed.data,
  })

  revalidatePath('/accounts')
  return { success: true, data: { id: account.id } }
}

export async function updateAccount(input: unknown): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = updateAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { id, ...updates } = parsed.data
  const existing = await getAccount(id)
  if (!existing) return { success: false, error: 'Account not found' }

  const slugUpdate = updates.name ? { slug: makeSlug(updates.name, id) } : {}

  await withFamilyContext(familyId, () =>
    db
      .update(financialAccounts)
      .set({ ...updates, ...slugUpdate, updatedAt: new Date() })
      .where(and(eq(financialAccounts.id, id), eq(financialAccounts.familyId, familyId)))
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'UPDATE',
    resourceType: 'financial_account',
    resourceId: id,
    oldValue: existing,
    newValue: updates,
  })

  revalidatePath('/accounts')
  return { success: true, data: undefined }
}

export async function deleteAccount(id: string): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const existing = await getAccount(id)
  if (!existing) return { success: false, error: 'Account not found' }

  const now = new Date()
  await withFamilyContext(familyId, async () => {
    await db
      .update(transactions)
      .set({ deletedAt: now })
      .where(
        and(
          eq(transactions.accountId, id),
          eq(transactions.familyId, familyId),
          isNull(transactions.deletedAt)
        )
      )
    await db
      .update(financialAccounts)
      .set({ deletedAt: now })
      .where(and(eq(financialAccounts.id, id), eq(financialAccounts.familyId, familyId)))
  })

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'DELETE',
    resourceType: 'financial_account',
    resourceId: id,
    oldValue: existing,
  })

  revalidatePath('/accounts')
  revalidatePath('/dashboard/transactions')
  return { success: true, data: undefined }
}
