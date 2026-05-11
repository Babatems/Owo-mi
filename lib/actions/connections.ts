'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  institutions,
  bankConnections,
  connectionSecrets,
  bankAccounts,
  accountMappings,
  financialAccounts,
} from '@/lib/db/schema'
import { plaidAggregator } from '@/lib/aggregators/plaid'
import { flinksAggregator } from '@/lib/aggregators/flinks'
import { seal, open, sealedToRow } from '@/lib/crypto/envelope'
import { getSession, getActiveFamilyId, withFamilyContext, type ActionResult } from './utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlaidAccountMeta = {
  externalAccountId: string
  name: string
  officialName: string | null
  mask: string | null
  type: string
  subtype: string | null
}

export type ConnectionWithAccounts = {
  id: string
  provider: 'plaid' | 'flinks' | 'manual'
  status: string
  lastSuccessfulSyncAt: Date | null
  institution: { name: string; logoUrl: string | null } | null
  bankAccounts: Array<{
    id: string
    name: string
    mask: string | null
    type: string
    subtype: string | null
    currentBalance: string | null
    mapping: { userAccountId: string } | null
  }>
}

type AccountType = (typeof financialAccounts.$inferInsert)['type']

// Maps Plaid's account type + subtype to our internal enum
function plaidTypeToAccountType(type: string, subtype: string | null): AccountType {
  const t = type.toLowerCase()
  const s = (subtype ?? '').toLowerCase()
  if (t === 'credit') return 'credit'
  if (t === 'investment') return 'investment'
  if (t === 'depository') {
    if (s === 'savings' || s === 'money market' || s === 'cd') return 'savings'
    return 'checking'
  }
  return 'checking'
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createLinkTokenAction(
  updateConnectionId?: string,
  redirectUri?: string
): Promise<ActionResult<{ linkToken: string }>> {
  try {
    const session = await getSession()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhooks`

    let accessToken: string | undefined
    if (updateConnectionId) {
      const secret = await db.query.connectionSecrets.findFirst({
        where: eq(connectionSecrets.connectionId, updateConnectionId),
      })
      if (!secret) throw new Error('Connection not found')
      accessToken = await open(
        {
          keyVersion: secret.keyVersion,
          wrappedDek: secret.wrappedDek,
          iv: secret.iv,
          authTag: secret.authTag,
          ciphertext: secret.ciphertextAccessToken,
        },
        updateConnectionId
      )
    }

    const linkToken = await plaidAggregator.createLinkToken({
      userId: session.user.id,
      webhookUrl,
      accessToken,
      redirectUri,
    })

    return { success: true, data: { linkToken } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create link token',
    }
  }
}

export async function exchangePublicTokenAction(input: {
  publicToken: string
  institutionId: string
  institutionName: string
  accounts: PlaidAccountMeta[]
}): Promise<ActionResult<{ connectionId: string }>> {
  try {
    const session = await getSession()
    const familyId = await getActiveFamilyId()

    return await withFamilyContext(familyId, async () => {
      // 1. Exchange public token for access token
      const { accessToken, itemId } = await plaidAggregator.exchangePublicToken(input.publicToken)

      // 2. Fetch institution metadata from Plaid
      const instMeta = await plaidAggregator.getInstitution(input.institutionId)

      // 3. Upsert institution
      const [institution] = await db
        .insert(institutions)
        .values({
          provider: 'plaid',
          externalId: instMeta.externalId,
          name: instMeta.name,
          primaryColor: instMeta.primaryColor,
          logoUrl: instMeta.logoUrl,
          oauthSupported: instMeta.oauthSupported,
        })
        .onConflictDoUpdate({
          target: [institutions.provider, institutions.externalId],
          set: {
            name: instMeta.name,
            primaryColor: instMeta.primaryColor,
            logoUrl: instMeta.logoUrl,
            updatedAt: new Date(),
          },
        })
        .returning()

      // 4. Insert bank connection
      const [connection] = await db
        .insert(bankConnections)
        .values({
          familyId,
          userId: session.user.id,
          provider: 'plaid',
          institutionId: institution.id,
          externalItemId: itemId,
          status: 'pending',
        })
        .returning()

      // 5. Envelope-encrypt the access token with connectionId as AAD
      const sealed = await seal(accessToken, connection.id)

      // 6. Store sealed token
      await db.insert(connectionSecrets).values({
        connectionId: connection.id,
        ...sealedToRow(sealed),
      })

      // 7. Insert bank accounts returned by Plaid in onSuccess metadata
      if (input.accounts.length > 0) {
        await db.insert(bankAccounts).values(
          input.accounts.map((a) => ({
            connectionId: connection.id,
            familyId,
            externalAccountId: a.externalAccountId,
            name: a.name,
            officialName: a.officialName,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
          }))
        )
      }

      revalidatePath('/dashboard/accounts')

      return { success: true, data: { connectionId: connection.id } }
    })
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect account',
    }
  }
}

export async function createAccountMappingAction(input: {
  bankAccountId: string
  userAccountId?: string // existing financial account
  newAccountName?: string // create a new one
  newAccountType?: string
}): Promise<ActionResult<{ userAccountId: string }>> {
  try {
    const familyId = await getActiveFamilyId()

    return await withFamilyContext(familyId, async () => {
      let userAccountId = input.userAccountId

      if (!userAccountId) {
        // Look up the bank account to get type + subtype for proper mapping
        const bankAccount = await db.query.bankAccounts.findFirst({
          where: eq(bankAccounts.id, input.bankAccountId),
        })
        const [created] = await db
          .insert(financialAccounts)
          .values({
            familyId,
            name: input.newAccountName ?? 'Connected Account',
            type: plaidTypeToAccountType(
              bankAccount?.type ?? 'depository',
              bankAccount?.subtype ?? null
            ),
          })
          .returning()
        userAccountId = created.id
      }

      await db
        .insert(accountMappings)
        .values({ userAccountId, bankAccountId: input.bankAccountId })
        .onConflictDoUpdate({
          target: [accountMappings.bankAccountId],
          set: { userAccountId },
        })

      revalidatePath('/dashboard/accounts')
      return { success: true, data: { userAccountId } }
    })
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to map account' }
  }
}

export async function getConnectionsAction(): Promise<ActionResult<ConnectionWithAccounts[]>> {
  try {
    const familyId = await getActiveFamilyId()

    const rows = await db.query.bankConnections.findMany({
      where: and(
        eq(bankConnections.familyId, familyId)
        // exclude fully disconnected connections
      ),
      with: {
        institution: true,
        bankAccounts: {
          with: { mapping: true },
        },
      },
      orderBy: (bc, { desc }) => [desc(bc.createdAt)],
    })

    const result: ConnectionWithAccounts[] = rows.map((c) => ({
      id: c.id,
      provider: c.provider,
      status: c.status,
      lastSuccessfulSyncAt: c.lastSuccessfulSyncAt,
      institution: c.institution
        ? { name: c.institution.name, logoUrl: c.institution.logoUrl }
        : null,
      bankAccounts: c.bankAccounts.map((ba) => ({
        id: ba.id,
        name: ba.name,
        mask: ba.mask,
        type: ba.type,
        subtype: ba.subtype,
        currentBalance: ba.currentBalance,
        mapping: ba.mapping ? { userAccountId: ba.mapping.userAccountId } : null,
      })),
    }))

    return { success: true, data: result }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to load connections',
    }
  }
}

export async function disconnectConnectionAction(
  connectionId: string
): Promise<ActionResult<void>> {
  try {
    const familyId = await getActiveFamilyId()

    return await withFamilyContext(familyId, async () => {
      const secret = await db.query.connectionSecrets.findFirst({
        where: eq(connectionSecrets.connectionId, connectionId),
      })

      if (secret) {
        try {
          const accessToken = await open(
            {
              keyVersion: secret.keyVersion,
              wrappedDek: secret.wrappedDek,
              iv: secret.iv,
              authTag: secret.authTag,
              ciphertext: secret.ciphertextAccessToken,
            },
            connectionId // must match seal() AAD
          )
          // Only revoke at Plaid (Flinks connections don't have an item-remove API)
          const conn = await db.query.bankConnections.findFirst({
            where: eq(bankConnections.id, connectionId),
          })
          if (conn?.provider === 'plaid') {
            await plaidAggregator.removeItem(accessToken)
          }
        } catch {
          // If revocation fails, still disconnect locally
        }
      }

      await db
        .update(bankConnections)
        .set({ status: 'disconnected', updatedAt: new Date() })
        .where(and(eq(bankConnections.id, connectionId), eq(bankConnections.familyId, familyId)))

      revalidatePath('/dashboard/accounts')
      return { success: true, data: undefined }
    })
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to disconnect' }
  }
}

export async function startBankSyncAction(connectionId: string): Promise<ActionResult<void>> {
  try {
    const familyId = await getActiveFamilyId()
    const { inngest } = await import('@/inngest/client')
    await inngest.send({
      name: 'plaid/initial-sync',
      data: { connectionId, familyId },
    })
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to start sync' }
  }
}

export async function exchangeLoginIdAction(input: {
  loginId: string
  institutionName: string
}): Promise<ActionResult<{ connectionId: string }>> {
  try {
    const session = await getSession()
    const familyId = await getActiveFamilyId()

    return await withFamilyContext(familyId, async () => {
      // Authorize with Flinks and validate loginId
      const { accessToken, itemId } = await flinksAggregator.exchangeLoginId(input.loginId)

      // Fetch accounts to populate bankAccounts table
      const flinksAccounts = await flinksAggregator.getAccounts(accessToken)

      // Upsert institution (Flinks doesn't have rich institution metadata)
      const [institution] = await db
        .insert(institutions)
        .values({
          provider: 'flinks',
          externalId: input.institutionName,
          name: input.institutionName,
          primaryColor: null,
          logoUrl: null,
          oauthSupported: false,
        })
        .onConflictDoUpdate({
          target: [institutions.provider, institutions.externalId],
          set: { name: input.institutionName, updatedAt: new Date() },
        })
        .returning()

      // Insert bank connection
      const [connection] = await db
        .insert(bankConnections)
        .values({
          familyId,
          userId: session.user.id,
          provider: 'flinks',
          institutionId: institution.id,
          externalItemId: itemId,
          status: 'pending',
        })
        .returning()

      // Encrypt the loginId (stored as accessToken) with connectionId as AAD
      const sealed = await seal(accessToken, connection.id)
      await db.insert(connectionSecrets).values({
        connectionId: connection.id,
        ...sealedToRow(sealed),
      })

      // Insert bank accounts
      if (flinksAccounts.length > 0) {
        await db.insert(bankAccounts).values(
          flinksAccounts.map((a) => ({
            connectionId: connection.id,
            familyId,
            externalAccountId: a.externalAccountId,
            name: a.name,
            officialName: a.officialName,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
          }))
        )
      }

      revalidatePath('/dashboard/accounts')
      return { success: true, data: { connectionId: connection.id } }
    })
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect Flinks account',
    }
  }
}

export async function startFlinksSyncAction(connectionId: string): Promise<ActionResult<void>> {
  try {
    const familyId = await getActiveFamilyId()
    const { inngest } = await import('@/inngest/client')
    await inngest.send({
      name: 'flinks/initial-sync',
      data: { connectionId, familyId },
    })
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to start Flinks sync',
    }
  }
}
