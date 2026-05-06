import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Owo-mi — Canadian Budget Tracker',
  description: 'Private, secure personal finance management built for Canadians.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#FAFAFA] text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
