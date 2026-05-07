import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { LandingNav } from '@/components/landing/Nav'
import { LandingFooter } from '@/components/landing/Footer'
import '@/app/globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  adjustFontFallback: true,
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isFr = locale === 'fr'
  return {
    metadataBase: new URL('https://owo-mi-five.vercel.app'),
    title: isFr
      ? 'Owó-mi — Votre argent. En entier. Enfin clair.'
      : 'Owó-mi — Finally know where your money goes.',
    description: isFr
      ? 'Owó-mi relie tous vos comptes canadiens pour vous montrer ce qui se passe vraiment. Conçu au Canada. LPRPDE et Loi 25 conforme.'
      : "Owó-mi connects every Canadian account and shows you what's really going on. Built in Canada. PIPEDA & Law 25 compliant.",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en-CA': '/en',
        'fr-CA': '/fr',
        'x-default': '/en',
      },
    },
    openGraph: {
      locale: isFr ? 'fr_CA' : 'en_CA',
      type: 'website',
      siteName: 'Owó-mi',
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <body className="marketing-bg text-neutral-900 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
            >
              {locale === 'fr' ? 'Aller au contenu' : 'Skip to content'}
            </a>
            <LandingNav />
            <main id="main" className="pb-20 md:pb-0">
              {children}
            </main>
            <LandingFooter />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
