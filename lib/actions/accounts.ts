'use server'

import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { financialAccounts } from '@/lib/db/schema'
import { createAccountSchema, updateAccountSchema } from '@/lib/validations/schemas'
import { getSession, getActiveFamilyId, withFamilyContext, writeAuditLog } from './utils'
import type { ActionResult } from './utils'

export async function getAccounts() {
  const familyId = await getActiveFamilyId()
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

export async function createAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = createAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const [account] = await withFamilyContext(familyId, () =>
    db
      .insert(financialAccounts)
      .values({ ...parsed.data, familyId })
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

  await withFamilyContext(familyId, () =>
    db
      .update(financialAccounts)
      .set({ ...updates, updatedAt: new Date() })
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

  await withFamilyContext(familyId, () =>
    db
      .update(financialAccounts)
      .set({ deletedAt: new Date() })
      .where(and(eq(financialAccounts.id, id), eq(financialAccounts.familyId, familyId)))
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'DELETE',
    resourceType: 'financial_account',
    resourceId: id,
    oldValue: existing,
  })

  revalidatePath('/accounts')
  return { success: true, data: undefined }
}
