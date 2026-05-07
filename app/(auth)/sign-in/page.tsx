'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { authClient } from '@/lib/auth/client'
import { signInSchema, magicLinkSchema } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type SignInValues = z.infer<typeof signInSchema>
type MagicLinkValues = z.infer<typeof magicLinkSchema>

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [tab, setTab] = useState<'password' | 'magic-link'>('password')

  const passwordForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema) as Resolver<SignInValues>,
    defaultValues: { email: '', password: '' },
  })

  const magicLinkForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema) as Resolver<MagicLinkValues>,
    defaultValues: { email: '' },
  })

  async function onPasswordSubmit(values: SignInValues) {
    setLoading(true)
    setError(undefined)
    try {
      const { error: authError } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      })
      if (authError) throw new Error(authError.message)
      const params = new URLSearchParams(window.location.search)
      router.push(params.get('next') ?? '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function onMagicLinkSubmit(values: MagicLinkValues) {
    setLoading(true)
    setError(undefined)
    try {
      await authClient.signIn.magicLink({ email: values.email })
      setMagicLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to Owó-mi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-md border border-neutral-200 text-sm">
          {(['password', 'magic-link'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-center transition-colors ${
                tab === t ? 'bg-neutral-100 font-medium' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t === 'password' ? 'Password' : 'Magic link'}
            </button>
          ))}
        </div>

        {tab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.ca"
                {...passwordForm.register('email')}
              />
              {passwordForm.formState.errors.email && (
                <p className="text-xs text-red-600">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...passwordForm.register('password')}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-red-600">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        )}

        {tab === 'magic-link' && (
          <>
            {magicLinkSent ? (
              <div className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                Check your email — we sent you a sign-in link.
              </div>
            ) : (
              <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ml-email">Email</Label>
                  <Input
                    id="ml-email"
                    type="email"
                    placeholder="jane@example.ca"
                    {...magicLinkForm.register('email')}
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send magic link'}
                </Button>
              </form>
            )}
          </>
        )}

        <Separator />

        <p className="text-center text-sm text-neutral-500">
          No account?{' '}
          <Link href="/sign-up" className="font-medium text-neutral-900 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
