import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
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

export default function AcceptInvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#FAFAFA] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
            <div className="mb-8 text-center">
              <p className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                <span style={{ color: 'var(--brand)' }}>✦</span> Owó-mi
              </p>
            </div>
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
