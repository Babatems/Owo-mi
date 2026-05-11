export type AggregatorAccount = {
  externalAccountId: string
  name: string
  officialName: string | null
  mask: string | null
  type: string
  subtype: string | null
  currency: string
  currentBalance: string | null
  availableBalance: string | null
  limitAmount: string | null
}

export type AggregatorTransaction = {
  externalTransactionId: string
  pendingExternalId: string | null
  pending: boolean
  accountId: string // matches AggregatorAccount.externalAccountId
  amount: number // Plaid convention: positive = debit, negative = credit
  isoCurrencyCode: string
  date: string // YYYY-MM-DD
  authorizedDate: string | null
  name: string
  merchantName: string | null
  merchantEntityId: string | null
  logoUrl: string | null
  website: string | null
  paymentChannel: string | null
  categoryPrimary: string | null
  categoryDetailed: string | null
  raw: Record<string, unknown>
}

export type SyncResult = {
  added: AggregatorTransaction[]
  modified: AggregatorTransaction[]
  removed: { externalTransactionId: string }[]
  nextCursor: string
  hasMore: boolean
}

export type InstitutionMeta = {
  externalId: string
  name: string
  primaryColor: string | null
  logoUrl: string | null
  oauthSupported: boolean
}

export interface BankAggregator {
  createLinkToken(params: {
    userId: string
    webhookUrl: string
    accessToken?: string // present for update mode (reconnect)
  }): Promise<string>

  exchangePublicToken(publicToken: string): Promise<{
    accessToken: string
    itemId: string
  }>

  getAccounts(accessToken: string): Promise<AggregatorAccount[]>

  syncTransactions(accessToken: string, cursor?: string): Promise<SyncResult>

  getInstitution(institutionId: string): Promise<InstitutionMeta>

  removeItem(accessToken: string): Promise<void>
}
