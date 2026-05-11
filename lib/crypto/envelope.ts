import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const kms = new KMSClient({ region: process.env.AWS_REGION ?? 'ca-central-1' })
const KEY_ID = process.env.KMS_KEY_ID ?? ''
const KEY_VERSION = 1

export type SealedToken = {
  keyVersion: number
  wrappedDek: string // base64
  iv: string // base64
  authTag: string // base64
  ciphertext: string // base64
}

/**
 * Encrypts plaintext using envelope encryption.
 * A fresh DEK is generated via KMS for each call and immediately zeroed after use.
 * The AAD (additional authenticated data) binds the ciphertext to its row — typically the connectionId.
 */
export async function seal(plaintext: string, aad: string): Promise<SealedToken> {
  const { Plaintext: dek, CiphertextBlob: wrappedDek } = await kms.send(
    new GenerateDataKeyCommand({ KeyId: KEY_ID, KeySpec: 'AES_256' })
  )
  if (!dek || !wrappedDek) throw new Error('KMS GenerateDataKey returned empty response')

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', dek, iv)
  cipher.setAAD(Buffer.from(aad))

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Zero the plaintext DEK immediately — do not let it linger in memory
  Buffer.from(dek).fill(0)

  return {
    keyVersion: KEY_VERSION,
    wrappedDek: Buffer.from(wrappedDek).toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  }
}

/**
 * Decrypts a sealed token. The AAD must match what was used during seal().
 */
export async function open(sealed: SealedToken, aad: string): Promise<string> {
  const { Plaintext: dek } = await kms.send(
    new DecryptCommand({ CiphertextBlob: Buffer.from(sealed.wrappedDek, 'base64') })
  )
  if (!dek) throw new Error('KMS Decrypt returned empty response')

  const iv = Buffer.from(sealed.iv, 'base64')
  const authTag = Buffer.from(sealed.authTag, 'base64')
  const ciphertext = Buffer.from(sealed.ciphertext, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', dek, iv)
  decipher.setAAD(Buffer.from(aad))
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  Buffer.from(dek).fill(0)

  return decrypted.toString('utf8')
}

export function sealedToRow(sealed: SealedToken) {
  return {
    keyVersion: sealed.keyVersion,
    wrappedDek: sealed.wrappedDek,
    iv: sealed.iv,
    authTag: sealed.authTag,
    ciphertextAccessToken: sealed.ciphertext,
  }
}
