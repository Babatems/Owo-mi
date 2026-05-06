'use server'

import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { createCategorySchema, updateCategorySchema } from '@/lib/validations/schemas'
import { getSession, getActiveFamilyId, withFamilyContext, writeAuditLog } from './utils'
import type { ActionResult } from './utils'

export type CategoryTree = {
  id: string
  familyId: string
  parentId: string | null
  name: string
  icon: string | null
  color: string | null
  type: 'income' | 'expense' | 'transfer'
  isSystem: boolean
  children: CategoryTree[]
}

export async function getCategories(): Promise<CategoryTree[]> {
  const familyId = await getActiveFamilyId()
  const all = await withFamilyContext(familyId, () =>
    db.query.categories.findMany({
      where: eq(categories.familyId, familyId),
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  )

  // Build tree from flat list
  const map = new Map<string, CategoryTree>()
  const roots: CategoryTree[] = []

  for (const cat of all) {
    map.set(cat.id, { ...cat, children: [] })
  }
  for (const cat of all) {
    const node = map.get(cat.id)!
    if (cat.parentId) {
      map.get(cat.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export async function getCategoriesFlat() {
  const familyId = await getActiveFamilyId()
  return withFamilyContext(familyId, () =>
    db.query.categories.findMany({
      where: eq(categories.familyId, familyId),
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  )
}

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = createCategorySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const [cat] = await withFamilyContext(familyId, () =>
    db
      .insert(categories)
      .values({ ...parsed.data, familyId })
      .returning({ id: categories.id })
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'CREATE',
    resourceType: 'category',
    resourceId: cat.id,
    newValue: parsed.data,
  })

  revalidatePath('/transactions')
  return { success: true, data: { id: cat.id } }
}

export async function updateCategory(input: unknown): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const parsed = updateCategorySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { id, ...updates } = parsed.data
  await withFamilyContext(familyId, () =>
    db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, id), eq(categories.familyId, familyId)))
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'UPDATE',
    resourceType: 'category',
    resourceId: id,
    newValue: updates,
  })

  revalidatePath('/transactions')
  return { success: true, data: undefined }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()

  await withFamilyContext(familyId, () =>
    db.delete(categories).where(and(eq(categories.id, id), eq(categories.familyId, familyId)))
  )

  await writeAuditLog({
    familyId,
    userId: session.user.id,
    action: 'DELETE',
    resourceType: 'category',
    resourceId: id,
  })

  revalidatePath('/transactions')
  return { success: true, data: undefined }
}
