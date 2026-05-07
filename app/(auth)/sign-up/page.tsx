'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authClient } from '@/lib/auth/client'
import { createFamily } from '@/lib/actions/families'
import { signUpSchema } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}

function SignUpForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState<string>()

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values: SignUpValues) {
    setLoading(true)
    setError(undefined)
    try {
      const { error: authError } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      if (authError) throw new Error(authError.message)

      const result = await createFamily({ name: `${values.name}'s Family` })
      if (!result.success) throw new Error(result.error)

      setEmailSent(values.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We sent a confirmation link to {emailSent}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Click the link in the email to activate your account, then come back to sign in.
          </p>
          <Link
            href={next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in'}
            className="block w-full rounded-md bg-neutral-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            Go to sign in
          </Link>
          <p className="text-center text-xs text-neutral-400">
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Join Owó-mi and start tracking your finances privately and securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Smith" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.ca"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-neutral-900 hover:underline dark:text-white"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Your data is stored in Canada and never sold.
        </p>
      </CardContent>
    </Card>
  )
}
