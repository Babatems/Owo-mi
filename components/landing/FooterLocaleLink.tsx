'use client'

import Link from 'next/link'
import { persistLocaleCookie, type AppLocale } from '@/lib/i18n/locale'

export function FooterLocaleLink({ altLocale, label }: { altLocale: AppLocale; label: string }) {
  return (
    <Link
      href={`/${altLocale}`}
      onClick={() => persistLocaleCookie(altLocale)}
      className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
    >
      {label}
    </Link>
  )
}
