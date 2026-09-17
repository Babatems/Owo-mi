'use client'

import { useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'

export function useThemeTransition() {
  const { theme, setTheme } = useTheme()
  const transitionRef = useRef<ViewTransition | null>(null)

  const handleThemeToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      document.documentElement.style.setProperty('--vt-x', `${rect.left + rect.width / 2}px`)
      document.documentElement.style.setProperty('--vt-y', `${rect.top + rect.height / 2}px`)
      const next = theme === 'dark' ? 'light' : 'dark'

      if (!document.startViewTransition || document.hidden) {
        setTheme(next)
        return
      }

      // A transition still in flight would otherwise reject with
      // "InvalidStateError: Transition was aborted" once superseded by this one.
      transitionRef.current?.skipTransition()

      const transition = document.startViewTransition(() => setTheme(next))
      transitionRef.current = transition
      // Chrome rejects `ready`/`updateCallbackDone`/`finished` independently, so
      // each needs its own handler or a skipped/interrupted transition surfaces
      // as an unhandled rejection.
      transition.ready.catch(() => {})
      transition.updateCallbackDone.catch(() => {})
      transition.finished
        .catch(() => {})
        .finally(() => {
          if (transitionRef.current === transition) transitionRef.current = null
        })
    },
    [theme, setTheme]
  )

  return { theme, setTheme, handleThemeToggle }
}
