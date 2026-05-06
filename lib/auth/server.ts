import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink, twoFactor, organization } from 'better-auth/plugins'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    twoFactor({
      issuer: 'Owo-mi',
      totpOptions: { period: 30, digits: 6 },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: integrate Resend email provider
        console.log(`Magic link for ${email}: ${url}`)
      },
    }),
    organization({ allowUserToCreateOrganization: true }),
  ],
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: '__Host',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
