import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Providers } from '@/components/providers'
import { LanguageSwitcher } from '@/components/language-switcher'
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

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const t = await getTranslations('auth')

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#FAFAFA] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
                <div className="mb-8 w-full max-w-sm">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/${locale}`}
                      className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    >
                      <ArrowLeft className="size-4" />
                      {t('backToHome')}
                    </Link>
                    <LanguageSwitcher className="px-0 py-0" />
                  </div>
                  <div className="mt-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                      Owó-mi
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {t('tagline')}
                    </p>
                  </div>
                </div>
                <div className="w-full max-w-sm">{children}</div>
              </div>
            </Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
