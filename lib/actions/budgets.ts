'use server'

import { eq, and, gte, lt, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { budgets, transactions } from '@/lib/db/schema'
import { createBudgetSchema, updateBudgetSchema } from '@/lib/validations/schemas'
import { getActiveFamilyId, withFamilyContext } from './utils'
import type { ActionResult } from './utils'

export type BudgetWithActual = {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  periodType: string
  periodStart: Date
  periodEnd: Date
  amountCents: number
  actualCents: number
  carryoverEnabled: boolean
  remainingCents: number
  percentUsed: number
}

function getPeriodEnd(periodStart: Date, periodType: string): Date {
  const end = new Date(periodStart)
  switch (periodType) {
    case 'weekly':
      end.setDate(end.getDate() + 7)
      break
    case 'biweekly':
      end.setDate(end.getDate() + 14)
      break
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1)
      break
    default: // monthly
      end.setMonth(end.getMonth() + 1)
  }
  return end
}

export async function getBudgetsWithActual(monthStart?: Date): Promise<BudgetWithActual[]> {
  const familyId = await getActiveFamilyId().catch(() => null)
  if (!familyId) return []

  const now = new Date()
  const start = monthStart ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)

  return withFamilyContext(familyId, async () => {
    const allBudgets = await db.query.budgets.findMany({
      where: and(
        eq(budgets.familyId, familyId),
        gte(budgets.periodStart, start),
        lt(budgets.periodStart, end)
      ),
      with: {
        category: { columns: { id: true, name: true, icon: true, color: true } },
      },
    })

    const results: BudgetWithActual[] = []
    for (const budget of allBudgets) {
      const periodEnd = getPeriodEnd(budget.periodStart, budget.periodType)

      const [row] = await db
        .select({ total: sql<string>`COALESCE(SUM(ABS(${transactions.amountCents})), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.familyId, familyId),
            eq(transactions.categoryId, budget.categoryId),
            isNull(transactions.deletedAt),
            lt(transactions.amountCents, 0),
            gte(transactions.date, budget.periodStart),
            lt(transactions.date, periodEnd)
          )
        )

      const actualCents = Number(row?.total ?? 0)
      const remainingCents = budget.amountCents - actualCents
      const percentUsed = budget.amountCents > 0 ? (actualCents / budget.amountCents) * 100 : 0

      results.push({
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name ?? 'Unknown',
        categoryIcon: budget.category?.icon ?? null,
        categoryColor: budget.category?.color ?? null,
        periodType: budget.periodType,
        periodStart: budget.periodStart,
        periodEnd,
        amountCents: budget.amountCents,
        actualCents,
        carryoverEnabled: budget.carryoverEnabled,
        remainingCents,
        percentUsed,
      })
    }

    return results.sort((a, b) => b.percentUsed - a.percentUsed)
  })
}

export async function createBudget(input: unknown): Promise<ActionResult<{ id: string }>> {
  const familyId = await getActiveFamilyId()
  const parsed = createBudgetSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const [budget] = await withFamilyContext(familyId, () =>
    db
      .insert(budgets)
      .values({ ...parsed.data, familyId })
      .returning({ id: budgets.id })
  )

  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true, data: { id: budget.id } }
}

export async function updateBudget(input: unknown): Promise<ActionResult<void>> {
  const familyId = await getActiveFamilyId()
  const parsed = updateBudgetSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { id, ...updates } = parsed.data
  await withFamilyContext(familyId, () =>
    db
      .update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.familyId, familyId)))
  )

  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function deleteBudget(id: string): Promise<ActionResult<void>> {
  const familyId = await getActiveFamilyId()
  await withFamilyContext(familyId, () =>
    db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.familyId, familyId)))
  )
  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true, data: undefined }
}
