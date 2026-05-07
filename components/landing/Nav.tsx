'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LandingNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function handleThemeToggle(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`)
    document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`)
    const next = theme === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => {
      setTheme(next)
    })
  }

  const isEn = pathname.startsWith('/en')
  const altLocale = isEn ? 'fr' : 'en'
  const altPath = pathname.replace(/^\/(en|fr)/, `/${altLocale}`)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-b border-neutral-200/60 bg-[var(--marketing-bg)]/90 backdrop-blur-md dark:border-neutral-800/60 dark:bg-[var(--marketing-bg-dark)]/90'
          : 'bg-transparent'
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href={isEn ? '/en' : '/fr'}
          className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-neutral-900 dark:text-white"
        >
          <span className="text-[var(--brand)]">✦</span>
          <span>Owó-mi</span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Locale toggle */}
          <Link
            href={altPath}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {t('switchLocale')}
          </Link>

          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="flex size-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            suppressHydrationWarning
          >
            <span className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </span>
          </button>

          <Link
            href="/sign-in"
            className="rounded-md px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {t('signIn')}
          </Link>

          <Link
            href="/sign-up"
            className="rounded-md px-4 py-1.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {t('startFree')} →
          </Link>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={handleThemeToggle}
            className="flex size-9 items-center justify-center text-neutral-500 dark:text-neutral-400"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            suppressHydrationWarning
          >
            <span className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-9 items-center justify-center rounded-md text-neutral-500 dark:text-neutral-400"
            aria-label={t('openMenu')}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-neutral-200/60 bg-[var(--marketing-bg)] px-4 py-4 md:hidden dark:border-neutral-800/60 dark:bg-[var(--marketing-bg-dark)]">
          <div className="flex flex-col gap-1">
            <Link
              href={altPath}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {t('switchLocale')}
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {t('signIn')}
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMenuOpen(false)}
              className="mt-1 rounded-md px-4 py-2.5 text-center text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {t('startFree')} →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
