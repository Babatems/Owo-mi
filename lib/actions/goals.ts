'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { savingsGoals } from '@/lib/db/schema'
import { createSavingsGoalSchema, updateSavingsGoalSchema } from '@/lib/validations/schemas'
import { getActiveFamilyId, withFamilyContext } from './utils'
import type { ActionResult } from './utils'

export async function getGoals() {
  const familyId = await getActiveFamilyId().catch(() => null)
  if (!familyId) return []
  return withFamilyContext(familyId, () =>
    db.query.savingsGoals.findMany({
      where: eq(savingsGoals.familyId, familyId),
      with: {
        linkedAccount: { columns: { id: true, name: true, type: true, balanceCents: true } },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  )
}

export async function createGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const familyId = await getActiveFamilyId()
  const parsed = createSavingsGoalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const [goal] = await withFamilyContext(familyId, () =>
    db
      .insert(savingsGoals)
      .values({ ...parsed.data, familyId })
      .returning({ id: savingsGoals.id })
  )

  revalidatePath('/goals')
  revalidatePath('/')
  return { success: true, data: { id: goal.id } }
}

export async function updateGoal(input: unknown): Promise<ActionResult<void>> {
  const familyId = await getActiveFamilyId()
  const parsed = updateSavingsGoalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { id, ...updates } = parsed.data
  await withFamilyContext(familyId, () =>
    db
      .update(savingsGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.familyId, familyId)))
  )

  revalidatePath('/goals')
  revalidatePath('/')
  return { success: true, data: undefined }
}

export async function deleteGoal(id: string): Promise<ActionResult<void>> {
  const familyId = await getActiveFamilyId()
  await withFamilyContext(familyId, () =>
    db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.familyId, familyId)))
  )
  revalidatePath('/goals')
  revalidatePath('/')
  return { success: true, data: undefined }
}
