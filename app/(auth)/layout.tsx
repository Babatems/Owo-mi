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
      <body className="h-full bg-[#FAFAFA] text-neutral-900">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <Providers>
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Owó-mi</h1>
                <p className="mt-1 text-sm text-neutral-500">Your Canadian budget tracker</p>
              </div>
              <div className="w-full max-w-sm">{children}</div>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
