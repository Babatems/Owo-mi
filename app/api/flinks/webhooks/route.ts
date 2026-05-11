import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { webhookEvents, bankConnections } from '@/lib/db/schema'
import { inngest } from '@/inngest/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const rawBody = await req.text()

  // Verify HMAC-SHA256 signature
  const signature = req.headers.get('x-flinks-signature')
  const secret = process.env.FLINKS_WEBHOOK_SECRET
  if (secret && signature) {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    try {
      if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
        return new Response('Invalid signature', { status: 401 })
      }
    } catch {
      return new Response('Invalid signature', { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const webhookType = (payload.Type ?? payload.WebhookType ?? 'UNKNOWN') as string
  const webhookCode = (payload.Code ?? payload.WebhookCode ?? 'UNKNOWN') as string
  const loginId = (payload.LoginId ?? payload.ItemId ?? '') as string

  const bodyShaHex = createHash('sha256').update(rawBody).digest('hex')
  const idempotencyKey = createHash('sha256')
    .update(`flinks:${webhookType}:${webhookCode}:${loginId}:${bodyShaHex}`)
    .digest('hex')

  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: 'flinks',
      webhookType,
      webhookCode,
      externalItemId: loginId,
      idempotencyKey,
      signatureValid: !!signature,
      payload,
      headers: Object.fromEntries(req.headers.entries()),
    })
    .onConflictDoNothing({ target: [webhookEvents.idempotencyKey] })
    .returning()

  if (inserted.length === 0) {
    return new Response('OK', { status: 200 })
  }

  // Find the connection by externalItemId (loginId stored as itemId)
  const connection = await db.query.bankConnections.findFirst({
    where: eq(bankConnections.externalItemId, loginId),
  })

  if (connection && (webhookType === 'REFRESH' || webhookCode === 'ACCOUNTS_UPDATED')) {
    await inngest.send({
      name: 'flinks/incremental-sync',
      data: { connectionId: connection.id, familyId: connection.familyId },
    })
  }

  await db
    .update(webhookEvents)
    .set({ processedAt: new Date(), attemptCount: 1 })
    .where(eq(webhookEvents.idempotencyKey, idempotencyKey))

  return new Response('OK', { status: 200 })
}
