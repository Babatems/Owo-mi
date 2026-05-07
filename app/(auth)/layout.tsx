import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Providers } from '@/components/providers'
import '@/app/globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#FAFAFA] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
              <div className="mb-8 w-full max-w-sm">
                <Link
                  href="/en"
                  className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to home
                </Link>
                <div className="mt-6 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Owó-mi
                  </h1>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Your Canadian budget tracker
                  </p>
                </div>
              </div>
              <div className="w-full max-w-sm">{children}</div>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
