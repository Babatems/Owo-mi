import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyPage() {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>We sent you a verification link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-neutral-600">
        <p>Click the link in the email to verify your address and activate your account.</p>
        <p>
          Back to{' '}
          <Link href="/sign-in" className="font-medium text-neutral-900 hover:underline">
            sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
