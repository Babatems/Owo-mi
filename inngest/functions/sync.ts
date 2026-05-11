/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq, and, sql } from 'drizzle-orm'
import { inngest } from '@/inngest/client'
import { db } from '@/lib/db'
import {
  bankConnections,
  connectionSecrets,
  bankAccounts,
  accountMappings,
  syncHistory,
  transactions,
  categories,
  financialAccounts,
} from '@/lib/db/schema'
import { open } from '@/lib/crypto/envelope'
import { plaidAggregator } from '@/lib/aggregators/plaid'
import { flinksAggregator } from '@/lib/aggregators/flinks'

// ─── Handle Plaid webhook events ──────────────────────────────────────────────

export const handleWebhook = inngest.createFunction(
  { id: 'plaid-handle-webhook', retries: 3, triggers: [{ event: 'plaid/webhook' }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { webhookType, webhookCode, itemId } = event.data as {
      webhookType: string
      webhookCode: string
      itemId: string
    }

    if (webhookType === 'TRANSACTIONS' && webhookCode === 'SYNC_UPDATES_AVAILABLE') {
      const connection = await step.run('find-connection', () =>
        db.query.bankConnections.findFirst({
          where: eq(bankConnections.externalItemId, itemId),
        })
      )
      if (!connection) return { skipped: 'connection not found' }

      await step.sendEvent('trigger-incremental-sync', {
        name: 'plaid/incremental-sync',
        data: { connectionId: connection.id, familyId: connection.familyId },
      })
    }

    if (webhookType === 'ITEM') {
      const connection = await step.run('find-connection', () =>
        db.query.bankConnections.findFirst({
          where: eq(bankConnections.externalItemId, itemId),
        })
      )
      if (!connection) return { skipped: 'connection not found' }

      if (webhookCode === 'ERROR') {
        const errorCode = (event.data as Record<string, unknown>).error_code as string
        if (errorCode === 'ITEM_LOGIN_REQUIRED') {
          await step.run('mark-login-required', () =>
            db
              .update(bankConnections)
              .set({ status: 'login_required', updatedAt: new Date() })
              .where(eq(bankConnections.id, connection.id))
          )
        }
      }

      if (webhookCode === 'LOGIN_REPAIRED') {
        await step.run('mark-active', () =>
          db
            .update(bankConnections)
            .set({ status: 'active', errorCode: null, errorMessage: null, updatedAt: new Date() })
            .where(eq(bankConnections.id, connection.id))
        )
        await step.sendEvent('trigger-sync-after-repair', {
          name: 'plaid/incremental-sync',
          data: { connectionId: connection.id, familyId: connection.familyId },
        })
      }

      if (webhookCode === 'USER_PERMISSION_REVOKED') {
        await step.run('mark-revoked', () =>
          db
            .update(bankConnections)
            .set({ status: 'permission_revoked', updatedAt: new Date() })
            .where(eq(bankConnections.id, connection.id))
        )
      }
    }

    return { handled: `${webhookType}/${webhookCode}` }
  }
)

// ─── Initial sync (triggered after exchangePublicToken) ───────────────────────

export const initialSync = inngest.createFunction(
  {
    id: 'plaid-initial-sync',
    retries: 4,
    concurrency: { key: 'event.data.connectionId', limit: 1 },
    triggers: [{ event: 'plaid/initial-sync' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { connectionId, familyId } = event.data as { connectionId: string; familyId: string }
    await runSync({ connectionId, familyId, step, cursor: undefined })
  }
)

// ─── Incremental sync (triggered by webhooks) ─────────────────────────────────

export const incrementalSync = inngest.createFunction(
  {
    id: 'plaid-incremental-sync',
    retries: 4,
    concurrency: { key: 'event.data.connectionId', limit: 1 },
    triggers: [{ event: 'plaid/incremental-sync' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { connectionId, familyId } = event.data as { connectionId: string; familyId: string }
    const connection = await step.run('load-connection', () =>
      db.query.bankConnections.findFirst({ where: eq(bankConnections.id, connectionId) })
    )
    await runSync({
      connectionId,
      familyId,
      step,
      cursor: connection?.cursor ?? undefined,
      provider: 'plaid',
    })
  }
)

// ─── Flinks initial sync ──────────────────────────────────────────────────────

export const flinksInitialSync = inngest.createFunction(
  {
    id: 'flinks-initial-sync',
    retries: 4,
    concurrency: { key: 'event.data.connectionId', limit: 1 },
    triggers: [{ event: 'flinks/initial-sync' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { connectionId, familyId } = event.data as { connectionId: string; familyId: string }
    await runSync({ connectionId, familyId, step, cursor: undefined, provider: 'flinks' })
  }
)

// ─── Flinks incremental sync (triggered by webhooks) ─────────────────────────

export const flinksIncrementalSync = inngest.createFunction(
  {
    id: 'flinks-incremental-sync',
    retries: 4,
    concurrency: { key: 'event.data.connectionId', limit: 1 },
    triggers: [{ event: 'flinks/incremental-sync' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { connectionId, familyId } = event.data as { connectionId: string; familyId: string }
    const connection = await step.run('load-connection', () =>
      db.query.bankConnections.findFirst({ where: eq(bankConnections.id, connectionId) })
    )
    await runSync({
      connectionId,
      familyId,
      step,
      cursor: connection?.cursor ?? undefined,
      provider: 'flinks',
    })
  }
)

// ─── Shared sync logic ────────────────────────────────────────────────────────

async function runSync({
  connectionId,
  familyId,
  step,
  cursor,
  provider = 'plaid',
}: {
  connectionId: string
  familyId: string
  step: any
  cursor: string | undefined
  provider?: string
}) {
  const startedAt = new Date()
  const historyRows: { id: string }[] = await step.run('create-sync-history', () =>
    db
      .insert(syncHistory)
      .values({ connectionId, status: 'running', startedAt })
      .returning({ id: syncHistory.id })
  )
  const historyId = historyRows[0]?.id
  if (!historyId) throw new Error('Failed to create sync history')

  try {
    // Decrypt access token
    const secret = await step.run('load-secret', () =>
      db.query.connectionSecrets.findFirst({
        where: eq(connectionSecrets.connectionId, connectionId),
      })
    )
    if (!secret) throw new Error('Connection secret not found')

    const accessToken: string = await step.run('decrypt-token', () =>
      open(
        {
          keyVersion: secret.keyVersion,
          wrappedDek: secret.wrappedDek,
          iv: secret.iv,
          authTag: secret.authTag,
          ciphertext: secret.ciphertextAccessToken,
        },
        connectionId // must match the AAD used in seal() — connectionId, not familyId
      )
    )

    // Load bank accounts for this connection (to map externalAccountId → bankAccount.id)
    const connectedAccounts: (typeof bankAccounts.$inferSelect)[] = await step.run(
      'load-bank-accounts',
      () => db.query.bankAccounts.findMany({ where: eq(bankAccounts.connectionId, connectionId) })
    )
    const accountMap = new Map(connectedAccounts.map((a) => [a.externalAccountId, a]))

    // Load categories for fuzzy matching
    const familyCategories: (typeof categories.$inferSelect)[] = await step.run(
      'load-categories',
      () => db.query.categories.findMany({ where: eq(categories.familyId, familyId) })
    )
    const categoryMap = new Map(familyCategories.map((c) => [c.name.toLowerCase(), c.id]))

    let currentCursor = cursor
    const originalCursor = cursor
    let totalAdded = 0
    let totalModified = 0
    let totalRemoved = 0
    let page = 0

    const aggregator = provider === 'flinks' ? flinksAggregator : plaidAggregator

    while (true) {
      page++
      let syncResult
      try {
        syncResult = await step.run(`sync-page-${page}`, () =>
          aggregator.syncTransactions(accessToken, currentCursor)
        )
      } catch (err: unknown) {
        const code = (err as any)?.response?.data?.error_code as string | undefined
        if (code === 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION') {
          currentCursor = originalCursor
          page = 0
          totalAdded = 0
          totalModified = 0
          totalRemoved = 0
          continue
        }
        throw err
      }

      // Upsert added transactions
      if (syncResult.added.length > 0) {
        await step.run(`upsert-added-${page}`, () =>
          db.transaction(async (tx) => {
            await tx.execute(sql.raw(`SET LOCAL "app.current_family" = '${familyId}'`))
            for (const t of syncResult.added) {
              const bankAccount = accountMap.get(t.accountId)
              if (!bankAccount) continue

              const [mapping] = await tx
                .select()
                .from(accountMappings)
                .where(eq(accountMappings.bankAccountId, bankAccount.id))
                .limit(1)
              if (!mapping) continue

              // Plaid: positive = debit, negative = credit → convert to our cents convention
              const amountCents = Math.round(-t.amount * 100)
              const categoryId = t.categoryPrimary
                ? (categoryMap.get(t.categoryPrimary.toLowerCase()) ?? null)
                : null

              await tx
                .insert(transactions)
                .values({
                  accountId: mapping.userAccountId,
                  familyId,
                  bankAccountId: bankAccount.id,
                  externalTransactionId: t.externalTransactionId,
                  pendingExternalId: t.pendingExternalId ?? null,
                  amountCents,
                  currency: t.isoCurrencyCode,
                  date: new Date(t.date),
                  description: t.merchantName ?? t.name,
                  txnStatus: t.pending ? 'pending' : 'posted',
                  merchantName: t.merchantName ?? null,
                  paymentChannel: t.paymentChannel ?? null,
                  logoUrl: t.logoUrl ?? null,
                  categoryId: categoryId ?? null,
                  raw: t.raw,
                })
                .onConflictDoNothing()
            }
          })
        )
        totalAdded += syncResult.added.length
      }

      // Update modified transactions
      if (syncResult.modified.length > 0) {
        await step.run(`upsert-modified-${page}`, () =>
          db.transaction(async (tx) => {
            await tx.execute(sql.raw(`SET LOCAL "app.current_family" = '${familyId}'`))
            for (const t of syncResult.modified) {
              const bankAccount = accountMap.get(t.accountId)
              if (!bankAccount) continue

              const amountCents = Math.round(-t.amount * 100)
              const categoryId = t.categoryPrimary
                ? (categoryMap.get(t.categoryPrimary.toLowerCase()) ?? null)
                : null

              await tx
                .update(transactions)
                .set({
                  amountCents,
                  description: t.merchantName ?? t.name,
                  txnStatus: t.pending ? 'pending' : 'posted',
                  merchantName: t.merchantName ?? null,
                  paymentChannel: t.paymentChannel ?? null,
                  logoUrl: t.logoUrl ?? null,
                  categoryId: categoryId ?? null,
                  raw: t.raw,
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(transactions.bankAccountId, bankAccount.id),
                    eq(transactions.externalTransactionId, t.externalTransactionId)
                  )
                )
            }
          })
        )
        totalModified += syncResult.modified.length
      }

      // Soft-delete removed transactions
      if (syncResult.removed.length > 0) {
        await step.run(`remove-txns-${page}`, () =>
          db.transaction(async (tx) => {
            await tx.execute(sql.raw(`SET LOCAL "app.current_family" = '${familyId}'`))
            for (const r of syncResult.removed) {
              await tx
                .update(transactions)
                .set({ txnStatus: 'removed', updatedAt: new Date() })
                .where(
                  and(
                    eq(transactions.familyId, familyId),
                    eq(transactions.externalTransactionId, r.externalTransactionId)
                  )
                )
            }
          })
        )
        totalRemoved += syncResult.removed.length
      }

      // Persist cursor after each page for resumability
      await step.run(`persist-cursor-${page}`, () =>
        db
          .update(bankConnections)
          .set({ cursor: syncResult.nextCursor, updatedAt: new Date() })
          .where(eq(bankConnections.id, connectionId))
      )

      currentCursor = syncResult.nextCursor
      if (!syncResult.hasMore) break
    }

    // Refresh balances from the aggregator and propagate to financial accounts
    await step.run('update-balances', async () => {
      const freshAccounts = await aggregator.getAccounts(accessToken)
      for (const fa of freshAccounts) {
        const bankAccount = accountMap.get(fa.externalAccountId)
        if (!bankAccount) continue

        await db
          .update(bankAccounts)
          .set({
            currentBalance: fa.currentBalance,
            availableBalance: fa.availableBalance,
            balanceUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.id, bankAccount.id))

        // Propagate balance to the linked financial account so the UI shows real balances
        if (fa.currentBalance != null) {
          const balanceCents = Math.round(parseFloat(fa.currentBalance) * 100)
          const [mapping] = await db
            .select({ userAccountId: accountMappings.userAccountId })
            .from(accountMappings)
            .where(eq(accountMappings.bankAccountId, bankAccount.id))
            .limit(1)
          if (mapping) {
            await db
              .update(financialAccounts)
              .set({ balanceCents, updatedAt: new Date() })
              .where(eq(financialAccounts.id, mapping.userAccountId))
          }
        }
      }
    })

    const completedAt = new Date()
    await step.run('mark-complete', () =>
      db
        .update(bankConnections)
        .set({
          status: 'active',
          lastSuccessfulSyncAt: completedAt,
          lastSyncAttemptAt: completedAt,
          consecutiveFailures: 0,
          cursor: currentCursor,
          updatedAt: completedAt,
        })
        .where(eq(bankConnections.id, connectionId))
    )

    await step.run('update-sync-history', () =>
      db
        .update(syncHistory)
        .set({
          status: 'success',
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          txnsAdded: totalAdded,
          txnsModified: totalModified,
          txnsRemoved: totalRemoved,
          cursorAfter: currentCursor,
        })
        .where(eq(syncHistory.id, historyId))
    )

    return { added: totalAdded, modified: totalModified, removed: totalRemoved }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await db
      .update(bankConnections)
      .set({ lastSyncAttemptAt: new Date(), updatedAt: new Date() })
      .where(eq(bankConnections.id, connectionId))
    await db
      .update(syncHistory)
      .set({ status: 'failed', completedAt: new Date(), errorMessage })
      .where(eq(syncHistory.id, historyId))
    throw err
  }
}

export const syncFunctions = [
  handleWebhook,
  initialSync,
  incrementalSync,
  flinksInitialSync,
  flinksIncrementalSync,
]
