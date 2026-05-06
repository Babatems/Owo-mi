'use server'

import { createHash } from 'node:crypto'
import { inArray, eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { transactions, financialAccounts } from '@/lib/db/schema'
import { getSession, getActiveFamilyId, withFamilyContext } from './utils'
import type { NormalizedRow } from '@/lib/import/types'
import type { ActionResult } from './utils'
import { sql } from 'drizzle-orm'

function importHash(row: NormalizedRow, accountId: string): string {
  return createHash('sha256')
    .update(`${row.date}_${row.amountCents}_${row.description.trim().toLowerCase()}_${accountId}`)
    .digest('hex')
}

type ImportInput = {
  accountId: string
  rows: NormalizedRow[]
}

type ImportOutput = {
  imported: number
  skipped: number
}

export async function bulkImportTransactions(
  input: ImportInput
): Promise<ActionResult<ImportOutput>> {
  const session = await getSession()
  const familyId = await getActiveFamilyId()
  const { accountId, rows } = input

  if (!rows.length) return { success: true, data: { imported: 0, skipped: 0 } }

  // Generate a hash for every incoming row
  const hashMap = new Map<string, NormalizedRow>()
  for (const row of rows) {
    hashMap.set(importHash(row, accountId), row)
  }
  const hashes = Array.from(hashMap.keys())

  const result = await withFamilyContext(familyId, async () => {
    // Find which hashes already exist
    const existing = await db.query.transactions.findMany({
      columns: { importHash: true },
      where: and(
        eq(transactions.familyId, familyId),
        eq(transactions.accountId, accountId),
        isNull(transactions.deletedAt),
        inArray(transactions.importHash, hashes)
      ),
    })
    const existingHashes = new Set(existing.map((t) => t.importHash).filter(Boolean) as string[])

    const toInsert = hashes
      .filter((h) => !existingHashes.has(h))
      .map((h) => {
        const row = hashMap.get(h)!
        return {
          accountId,
          familyId,
          amountCents: row.amountCents,
          currency: 'CAD',
          date: new Date(row.date),
          description: row.description,
          importHash: h,
          reviewed: false,
        }
      })

    if (toInsert.length) {
      await db.insert(transactions).values(toInsert)

      // Update account balance: sum of all inserted amounts
      const delta = toInsert.reduce((sum, t) => sum + t.amountCents, 0)
      await db
        .update(financialAccounts)
        .set({
          balanceCents: sql`${financialAccounts.balanceCents} + ${delta}`,
          updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, accountId))
    }

    return { imported: toInsert.length, skipped: existingHashes.size }
  })

  await db
    .insert(
      // audit log entry for the import
      (await import('@/lib/db/schema')).auditLog
    )
    .values({
      familyId,
      userId: session.user.id,
      action: 'CREATE',
      resourceType: 'import',
      newValue: { accountId, imported: result.imported, skipped: result.skipped },
    })

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  revalidatePath('/')
  return { success: true, data: result }
}
