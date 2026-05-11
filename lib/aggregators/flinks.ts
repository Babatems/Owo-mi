import type {
  AggregatorAccount,
  AggregatorTransaction,
  SyncResult,
  InstitutionMeta,
} from './interface'

// Flinks uses loginId (stored as our "accessToken") to re-authorize on each sync.
// Each operation starts with POST /Authorize → requestId, then polls for results.

function baseUrl(): string {
  return `https://${process.env.FLINKS_INSTANCE}.private.fin.ag/v3/${process.env.FLINKS_CUSTOMER_ID}`
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(process.env.FLINKS_API_KEY
      ? { 'Ocp-Apim-Subscription-Key': process.env.FLINKS_API_KEY }
      : {}),
  }
}

async function authorize(loginId: string): Promise<string> {
  const res = await fetch(`${baseUrl()}/Authorize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ LoginId: loginId, Save: true, MostRecentCached: false }),
  })
  const data = (await res.json()) as { RequestId?: string; FlinksCode?: string }
  if (!res.ok || !data.RequestId) {
    throw new Error(`Flinks authorize failed: ${data.FlinksCode ?? res.status}`)
  }
  return data.RequestId
}

// Polls an endpoint until FlinksCode is no longer OPERATION_PENDING (max 30s)
async function poll<T>(fn: () => Promise<T & { FlinksCode?: string }>): Promise<T> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const result = await fn()
    if (result.FlinksCode !== 'OPERATION_PENDING') return result
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error('Flinks operation timed out (OPERATION_PENDING)')
}

function mapAccountType(flinksType: string): string {
  const t = flinksType.toLowerCase()
  if (t === 'savings') return 'savings'
  if (t === 'credit' || t === 'creditcard') return 'credit'
  if (t === 'investment' || t === 'rrsp' || t === 'tfsa') return 'investment'
  return 'checking' // Operations, Loan, etc.
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransaction(t: any, accountId: string): AggregatorTransaction {
  // Flinks: Debit=true → money out (positive amountCents), Credit=true → money in (negative)
  // We follow Plaid convention: positive amount = debit so sync.ts formula -t.amount*100 works
  const rawAmount = typeof t.Amount === 'number' ? t.Amount : parseFloat(t.Amount ?? '0')
  const amount = t.Debit ? Math.abs(rawAmount) : -Math.abs(rawAmount)

  return {
    externalTransactionId: t.Id ?? t.TransactionId ?? String(t.Date) + String(rawAmount),
    pendingExternalId: null,
    pending: (t.Status ?? '').toLowerCase() === 'pending',
    accountId,
    amount,
    isoCurrencyCode: t.Currency ?? 'CAD',
    date:
      typeof t.Date === 'string'
        ? t.Date.split('T')[0]
        : new Date(t.Date).toISOString().split('T')[0],
    authorizedDate: null,
    name: t.Description ?? t.Memo ?? '',
    merchantName: t.Merchant?.Name ?? null,
    merchantEntityId: null,
    logoUrl: null,
    website: null,
    paymentChannel: null,
    categoryPrimary: t.Category ?? null,
    categoryDetailed: null,
    raw: t as Record<string, unknown>,
  }
}

export class FlinksAggregator {
  getConnectUrl(redirectUrl?: string): string {
    const instance = process.env.FLINKS_INSTANCE ?? 'toolbox-sandbox'
    const params = new URLSearchParams({
      innerRedirect: 'true',
      ...(redirectUrl ? { redirectUrl } : {}),
    })
    return `https://${instance}.connect.flinks.com/?${params}`
  }

  // loginId from iframe postMessage — store as our "access token"
  async exchangeLoginId(loginId: string): Promise<{ accessToken: string; itemId: string }> {
    await authorize(loginId) // throws if invalid loginId
    return { accessToken: loginId, itemId: loginId }
  }

  async getAccounts(loginId: string): Promise<AggregatorAccount[]> {
    const requestId = await authorize(loginId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await poll<any>(() =>
      fetch(`${baseUrl()}/BankingServices/GetAccountsDetail?RequestId=${requestId}`, {
        headers: headers(),
      }).then((r) => r.json())
    )
    if (!data.Accounts) throw new Error(`Flinks GetAccountsDetail failed: ${data.FlinksCode}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.Accounts as any[]).map((a) => ({
      externalAccountId: a.Id,
      name: a.Title ?? a.AccountNumber?.Mask ?? a.Id,
      officialName: a.Title ?? null,
      mask: a.AccountNumber?.Mask ?? null,
      type: mapAccountType(a.Type ?? 'Operations'),
      subtype: a.Type ?? null,
      currency: a.Currency ?? 'CAD',
      currentBalance: a.Balance?.Current?.toString() ?? null,
      availableBalance: a.Balance?.Available?.toString() ?? null,
      limitAmount: a.Balance?.Limit?.toString() ?? null,
    }))
  }

  async syncTransactions(loginId: string, cursor?: string): Promise<SyncResult> {
    const requestId = await authorize(loginId)
    const fromDate =
      cursor ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate = new Date().toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await poll<any>(() =>
      fetch(`${baseUrl()}/BankingServices/GetTransactions`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          RequestId: requestId,
          DateFrom: fromDate,
          DateTo: toDate,
          GetMerchant: true,
        }),
      }).then((r) => r.json())
    )
    if (!data.Accounts) throw new Error(`Flinks GetTransactions failed: ${data.FlinksCode}`)

    const added: AggregatorTransaction[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const account of data.Accounts as any[]) {
      const accountId: string = account.Id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const txn of (account.Transactions as any[]) ?? []) {
        added.push(mapTransaction(txn, accountId))
      }
    }

    return {
      added,
      modified: [],
      removed: [],
      // Use today as the next cursor so incremental syncs fetch from here
      nextCursor: toDate,
      hasMore: false,
    }
  }

  async getInstitution(institutionId: string): Promise<InstitutionMeta> {
    // Flinks doesn't have a separate institution lookup API — use the name directly
    return {
      externalId: institutionId,
      name: institutionId,
      primaryColor: null,
      logoUrl: null,
      oauthSupported: false,
    }
  }
}

export const flinksAggregator = new FlinksAggregator()
