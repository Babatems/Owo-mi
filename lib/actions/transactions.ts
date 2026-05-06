'use server'

import { eq, and, isNull, gte, lte, ilike, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { transactions, transactionTags, categorizationRules } from '@/lib/db/schema'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
} from '@/lib/validations/schemas'
import { getSession, getActiveFamilyId, withFamilyContext, writeAuditLog } from './utils'
import type { ActionResult } from './utils'
import type { TransactionFilters } from '@/lib/validations/schemas'

export async function getTransactions(rawFilters?: Partial<TransactionFilters>) {
  const familyId = await getActiveFamilyId().catch(() => null)
  if (!familyId) return []
  const filters = transactionFiltersSchema.parse(rawFilters ?? {})
  const { page, limit, accountId, categoryId, startDate, endDate, search } = filters

  return withFamilyContext(familyId, async () => {
    const conditions = [eq(transactions.familyId, familyId), isNull(transactions.deletedAt)]
    if (accountId) conditions.push(eq(transactions.accountId, accountId))
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
    if (startDate) conditions.push(gte(transactions.date, startDate))
    if (endDate) conditions.push(lte(transactions.date, endDate))
    if (search) conditions.push(ilike(transactions.description, `%${search}%`))

    const rows = await db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      limit,
      offset: (page - 1) * limit,
      with: {
        account: { columns: { id: true, name: true, type: true } },
        category: { columns: { id: true, name: true, icon: true, color: true } },
      },
    })
    return rows
  })
}

export async function getTransaction(id: string) {
  const familyId = await getActiveFamilyId()
  return withFamilyContext(familyId, () =>
    db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.familyId, familyId),
        isNull(transactions.deletedAt)
      ),
      with: {
        account: true,
        category: true,
        tags: { with: { tag: true } },
      },
    })
  )
}

export async function createTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = createTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { tagIds, ...txData } = parsed.data

  const { id: txId, categoryId: resolvedCategoryId } = await withFamilyContext(
    familyId,
    async () => {
      // Auto-categorize inside the RLS context so categorization_rules are visible
      let categoryId = txData.categoryId
      if (!categoryId) {
        categoryId = await applyCategorizationRules(
          familyId,
          txData.description,
          txData.amountCents
        )
      }
      const [row] = await db
        .insert(transactions)
        .values({ ...txData, categoryId, familyId })
        .returning({ id: transactions.id })
      return { id: row.id, categoryId }
    }
  )

  if (tagIds?.length) {
    await db.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: txId, tagId })))
  }

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'transaction',
    resourceId: txId,
    newValue: { ...txData, categoryId: resolvedCategoryId },
  })

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true, data: { id: txId } }
}

export async function updateTransaction(input: unknown): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = updateTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { id, tagIds, ...updates } = parsed.data
  const existing = await getTransaction(id)
  if (!existing) return { success: false, error: 'Transaction not found' }

  await withFamilyContext(familyId, () =>
    db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.familyId, familyId)))
  )

  if (tagIds !== undefined) {
    await db.delete(transactionTags).where(eq(transactionTags.transactionId, id))
    if (tagIds.length) {
      await db.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: id, tagId })))
    }
  }

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'UPDATE',
    resourceType: 'transaction',
    resourceId: id,
    oldValue: existing,
    newValue: updates,
  })

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function deleteTransaction(id: string): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const existing = await getTransaction(id)
  if (!existing) return { success: false, error: 'Transaction not found' }

  await withFamilyContext(familyId, () =>
    db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.familyId, familyId)))
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'DELETE',
    resourceType: 'transaction',
    resourceId: id,
    oldValue: { amountCents: existing.amountCents, description: existing.description },
  })

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true, data: undefined }
}

async function applyCategorizationRules(
  familyId: string,
  description: string,
  amountCents: number
): Promise<string | undefined> {
  const rules = await db.query.categorizationRules.findMany({
    where: and(eq(categorizationRules.familyId, familyId), eq(categorizationRules.enabled, true)),
    orderBy: (t, { asc }) => [asc(t.priority)],
  })

  for (const rule of rules) {
    const value =
      rule.field === 'description' ? description.toLowerCase() : String(Math.abs(amountCents))
    const ruleValue = rule.value.toLowerCase()

    let matches = false
    switch (rule.operator) {
      case 'contains':
        matches = value.includes(ruleValue)
        break
      case 'equals':
        matches = value === ruleValue
        break
      case 'starts_with':
        matches = value.startsWith(ruleValue)
        break
      case 'ends_with':
        matches = value.endsWith(ruleValue)
        break
      case 'greater_than':
        matches = Number(value) > Number(ruleValue)
        break
      case 'less_than':
        matches = Number(value) < Number(ruleValue)
        break
    }

    if (matches) return rule.categoryId
  }
  return undefined
}
