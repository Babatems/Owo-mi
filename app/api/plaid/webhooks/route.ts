import { createHash, timingSafeEqual } from 'crypto'
import * as jose from 'jose'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhookEvents } from '@/lib/db/schema'
import { inngest } from '@/inngest/client'
import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── JWK cache (15-min TTL, keyed by kid) ────────────────────────────────────

type CachedJwk = { key: CryptoKey; expiresAt: number }
const jwkCache = new Map<string, CachedJwk>()

const plaidClient = new PlaidApi(
  new Configuration({
    basePath:
      PlaidEnvironments[(process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      },
    },
  })
)

async function getJwk(kid: string): Promise<CryptoKey> {
  const cached = jwkCache.get(kid)
  if (cached && cached.expiresAt > Date.now()) return cached.key

  const response = await plaidClient.webhookVerificationKeyGet({ key_id: kid })
  const jwk = response.data.key as jose.JWK
  const key = (await jose.importJWK(jwk, 'ES256')) as CryptoKey
  jwkCache.set(kid, { key, expiresAt: Date.now() + 15 * 60 * 1000 })
  return key
}

// ─── Webhook receiver ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody = await req.text()

  // 1. Extract and verify Plaid JWT
  const verificationHeader = req.headers.get('plaid-verification')
  if (!verificationHeader) {
    return new Response('Missing plaid-verification header', { status: 400 })
  }

  let payload: Record<string, unknown>
  let signatureValid = false

  try {
    const decoded = jose.decodeProtectedHeader(verificationHeader)
    const kid = decoded.kid
    if (!kid) throw new Error('Missing kid in JWT header')

    const jwk = await getJwk(kid)
    const { payload: jwtPayload } = await jose.jwtVerify(verificationHeader, jwk, {
      algorithms: ['ES256'],
    })

    // 2. Replay attack defense: reject JWTs older than 5 minutes
    const iat = jwtPayload.iat ?? 0
    if (Date.now() / 1000 - iat > 300) {
      return new Response('Webhook JWT expired', { status: 400 })
    }

    // 3. Verify body hash matches JWT claim
    const bodySha = createHash('sha256').update(rawBody).digest()
    const claimedSha = Buffer.from(jwtPayload.request_body_sha256 as string, 'hex')
    if (!timingSafeEqual(bodySha, claimedSha)) {
      return new Response('Body hash mismatch', { status: 400 })
    }

    payload = JSON.parse(rawBody) as Record<string, unknown>
    signatureValid = true
  } catch {
    return new Response('Invalid webhook signature', { status: 400 })
  }

  const webhookType = payload.webhook_type as string
  const webhookCode = payload.webhook_code as string
  const itemId = (payload.item_id ?? payload.account_id ?? '') as string

  // 4. Build idempotency key
  const bodyShaHex = createHash('sha256').update(rawBody).digest('hex')
  const idempotencyKey = createHash('sha256')
    .update(`plaid:${webhookType}:${webhookCode}:${itemId}:${bodyShaHex}`)
    .digest('hex')

  // 5. Insert with dedup — if 0 rows inserted, it's a duplicate
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: 'plaid',
      webhookType,
      webhookCode,
      externalItemId: itemId,
      idempotencyKey,
      signatureValid,
      payload: payload as Record<string, unknown>,
      headers: Object.fromEntries(req.headers.entries()),
    })
    .onConflictDoNothing({ target: [webhookEvents.idempotencyKey] })
    .returning()

  if (inserted.length === 0) {
    // Duplicate — ack immediately
    return new Response('OK', { status: 200 })
  }

  // 6. Hand off to Inngest (must return within 10s)
  await inngest.send({
    name: 'plaid/webhook',
    data: { webhookType, webhookCode, itemId, payload },
  })

  // 7. Mark processed
  await db
    .update(webhookEvents)
    .set({ processedAt: new Date(), attemptCount: 1 })
    .where(eq(webhookEvents.idempotencyKey, idempotencyKey))

  return new Response('OK', { status: 200 })
}
