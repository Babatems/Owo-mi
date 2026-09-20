'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { persistLocaleCookie, type AppLocale } from '@/lib/i18n/locale'
import { cn } from '@/lib/utils'

const LABELS: Record<AppLocale, string> = { en: 'English', fr: 'Français' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const nextLocale: AppLocale = locale === 'en' ? 'fr' : 'en'

  function handleClick() {
    persistLocaleCookie(nextLocale)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Switch language to ${LABELS[nextLocale]}`}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
        className
      )}
    >
      {LABELS[nextLocale]}
    </button>
  )
}
