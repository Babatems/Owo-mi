'use server'

import { eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import {
  financialAccounts,
  categories,
  tags,
  transactions,
  transactionTags,
  budgets,
  savingsGoals,
  categorizationRules,
  auditLog,
  bankConnections,
  connectionSecrets,
  bankAccounts,
  accountMappings,
  syncHistory,
} from '@/lib/db/schema'
import { user, organization, verification } from '@/lib/db/auth-schema'
import { getSession, getActiveFamilyIdOrNull } from './utils'
import type { ActionResult } from './utils'

export async function deleteAccount(): Promise<ActionResult<void>> {
  let session: Awaited<ReturnType<typeof getSession>>
  try {
    session = await getSession()
  } catch {
    return { success: false, error: 'Not authenticated.' }
  }

  const familyId = await getActiveFamilyIdOrNull()
  const userId = session.user.id
  const userEmail = session.user.email

  try {
    await db.transaction(async (tx) => {
      if (familyId) {
        // 1. transactionTags — no familyId column; delete via transactions
        const txnIds = (
          await tx
            .select({ id: transactions.id })
            .from(transactions)
            .where(eq(transactions.familyId, familyId))
        ).map((r) => r.id)
        if (txnIds.length > 0) {
          await tx.delete(transactionTags).where(inArray(transactionTags.transactionId, txnIds))
        }

        // 2. transactions
        await tx.delete(transactions).where(eq(transactions.familyId, familyId))

        // 3-7. Bank connection tree (accountMappings → syncHistory → bankAccounts → connectionSecrets → bankConnections)
        const connIds = (
          await tx
            .select({ id: bankConnections.id })
            .from(bankConnections)
            .where(eq(bankConnections.familyId, familyId))
        ).map((r) => r.id)
        if (connIds.length > 0) {
          const bankAcctIds = (
            await tx
              .select({ id: bankAccounts.id })
              .from(bankAccounts)
              .where(inArray(bankAccounts.connectionId, connIds))
          ).map((r) => r.id)
          if (bankAcctIds.length > 0) {
            await tx
              .delete(accountMappings)
              .where(inArray(accountMappings.bankAccountId, bankAcctIds))
          }
          await tx.delete(syncHistory).where(inArray(syncHistory.connectionId, connIds))
          await tx.delete(bankAccounts).where(inArray(bankAccounts.connectionId, connIds))
          await tx.delete(connectionSecrets).where(inArray(connectionSecrets.connectionId, connIds))
        }
        await tx.delete(bankConnections).where(eq(bankConnections.familyId, familyId))

        // 8-14. Remaining app tables
        await tx.delete(savingsGoals).where(eq(savingsGoals.familyId, familyId))
        await tx.delete(budgets).where(eq(budgets.familyId, familyId))
        await tx.delete(categorizationRules).where(eq(categorizationRules.familyId, familyId))
        await tx.delete(financialAccounts).where(eq(financialAccounts.familyId, familyId))
        await tx.delete(categories).where(eq(categories.familyId, familyId))
        await tx.delete(tags).where(eq(tags.familyId, familyId))
        await tx.delete(auditLog).where(eq(auditLog.familyId, familyId))

        // 15. organization — DB cascades member + invitation
        await tx.delete(organization).where(eq(organization.id, familyId))
      }

      // 16. verification — no FK, delete by email
      await tx.delete(verification).where(eq(verification.identifier, userEmail))

      // 17. user — DB cascades session, account, twoFactor
      await tx.delete(user).where(eq(user.id, userId))
    })
  } catch (err) {
    console.error('[deleteAccount]', err instanceof Error ? err.message : 'unknown')
    return { success: false, error: 'Failed to delete account. Please try again.' }
  }

  // Clear the session cookie so the 5-minute cookie cache doesn't keep the user "logged in"
  await auth.api.signOut({ headers: await headers() }).catch(() => null)

  return { success: true, data: undefined }
}
