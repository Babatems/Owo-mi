import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
import type {
  BankAggregator,
  AggregatorAccount,
  AggregatorTransaction,
  SyncResult,
  InstitutionMeta,
} from './interface'

// Read credentials lazily so env vars are always current (avoids stale empty strings at module load)
function getClient(): PlaidApi {
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
          'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
        },
      },
    })
  )
}

// Plaid SDK uses Axios — real error details are in err.response.data, not err.message
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function plaidError(err: any): Error {
  const data = err?.response?.data
  if (data?.error_code) {
    return new Error(
      `${data.error_code}: ${data.error_message ?? data.display_message ?? ''}`.trim()
    )
  }
  return err instanceof Error ? err : new Error(String(err))
}

class PlaidAggregator implements BankAggregator {
  async createLinkToken({
    userId,
    webhookUrl,
    accessToken,
    redirectUri,
  }: {
    userId: string
    webhookUrl: string
    accessToken?: string
    redirectUri?: string
  }): Promise<string> {
    // Plaid sandbox only has US test institutions (First Platypus Bank etc.)
    // Switch to CA in production when connecting real Canadian banks
    const isSandbox = (process.env.PLAID_ENV ?? 'sandbox') === 'sandbox'
    const base = {
      user: { client_user_id: userId },
      client_name: 'Owó-mi',
      language: 'en' as const,
      country_codes: isSandbox ? [CountryCode.Us] : [CountryCode.Ca],
      webhook: webhookUrl,
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    }

    try {
      const response = accessToken
        ? await getClient().linkTokenCreate({ ...base, access_token: accessToken })
        : await getClient().linkTokenCreate({
            ...base,
            products: [Products.Transactions],
            transactions: { days_requested: 730 },
          })

      return response.data.link_token
    } catch (err) {
      throw plaidError(err)
    }
  }

  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    try {
      const response = await getClient().itemPublicTokenExchange({ public_token: publicToken })
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      }
    } catch (err) {
      throw plaidError(err)
    }
  }

  async getAccounts(accessToken: string): Promise<AggregatorAccount[]> {
    try {
      const response = await getClient().accountsGet({ access_token: accessToken })
      return response.data.accounts.map((a) => ({
        externalAccountId: a.account_id,
        name: a.name,
        officialName: a.official_name ?? null,
        mask: a.mask ?? null,
        type: a.type,
        subtype: a.subtype ?? null,
        currency: a.balances.iso_currency_code ?? 'CAD',
        currentBalance: a.balances.current?.toString() ?? null,
        availableBalance: a.balances.available?.toString() ?? null,
        limitAmount: a.balances.limit?.toString() ?? null,
      }))
    } catch (err) {
      throw plaidError(err)
    }
  }

  async syncTransactions(accessToken: string, cursor?: string): Promise<SyncResult> {
    try {
      const response = await getClient().transactionsSync({
        access_token: accessToken,
        cursor: cursor ?? '',
        count: 500,
      })
      const { data } = response
      return {
        added: data.added.map(this.mapTransaction),
        modified: data.modified.map(this.mapTransaction),
        removed: data.removed.map((r) => ({ externalTransactionId: r.transaction_id })),
        nextCursor: data.next_cursor,
        hasMore: data.has_more,
      }
    } catch (err) {
      throw plaidError(err)
    }
  }

  async getInstitution(institutionId: string): Promise<InstitutionMeta> {
    // Try CA first; fall back to US for sandbox institutions
    try {
      const response = await getClient().institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Ca],
        options: { include_optional_metadata: true },
      })
      const inst = response.data.institution
      return {
        externalId: inst.institution_id,
        name: inst.name,
        primaryColor: inst.primary_color ?? null,
        logoUrl: inst.logo ? `data:image/png;base64,${inst.logo}` : null,
        oauthSupported: inst.oauth ?? false,
      }
    } catch {
      const response = await getClient()
        .institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
          options: { include_optional_metadata: true },
        })
        .catch((err) => {
          throw plaidError(err)
        })
      const inst = response.data.institution
      return {
        externalId: inst.institution_id,
        name: inst.name,
        primaryColor: inst.primary_color ?? null,
        logoUrl: inst.logo ? `data:image/png;base64,${inst.logo}` : null,
        oauthSupported: inst.oauth ?? false,
      }
    }
  }

  async removeItem(accessToken: string): Promise<void> {
    try {
      await getClient().itemRemove({ access_token: accessToken })
    } catch (err) {
      throw plaidError(err)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapTransaction(t: any): AggregatorTransaction {
    return {
      externalTransactionId: t.transaction_id,
      pendingExternalId: t.pending_transaction_id ?? null,
      pending: t.pending,
      accountId: t.account_id,
      amount: t.amount,
      isoCurrencyCode: t.iso_currency_code ?? 'CAD',
      date: t.date,
      authorizedDate: t.authorized_date ?? null,
      name: t.name,
      merchantName: t.merchant_name ?? null,
      merchantEntityId: t.merchant_entity_id ?? null,
      logoUrl: t.logo_url ?? null,
      website: t.website ?? null,
      paymentChannel: t.payment_channel ?? null,
      categoryPrimary: t.personal_finance_category?.primary ?? null,
      categoryDetailed: t.personal_finance_category?.detailed ?? null,
      raw: t as unknown as Record<string, unknown>,
    }
  }
}

export const plaidAggregator = new PlaidAggregator()
