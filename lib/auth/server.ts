import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor, organization } from 'better-auth/plugins'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'
import { resend, EMAIL_FROM } from '@/lib/email'
import { verificationEmailHtml } from '@/lib/email/templates'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string; name: string }
      url: string
    }) => {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'Confirm your Owó-mi account',
        html: verificationEmailHtml({ name: user.name, url }),
      })
    },
  },
  plugins: [
    twoFactor({
      issuer: 'Owo-mi',
      totpOptions: { period: 30, digits: 6 },
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
