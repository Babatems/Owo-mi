'use client'

import { useEffect, useRef, useCallback } from 'react'

interface IdleTimeoutOptions {
  onWarn: () => void
  onTimeout: () => void
  onActivity: () => void
  warnMs?: number
  graceMs?: number
}

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

export function useIdleTimeout({
  onWarn,
  onTimeout,
  onActivity,
  warnMs = 10 * 60 * 1000,
  graceMs = 2 * 60 * 1000,
}: IdleTimeoutOptions) {
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warned = useRef(false)

  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current)
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current)
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    warned.current = false
    warnTimer.current = setTimeout(() => {
      warned.current = true
      onWarn()
      timeoutTimer.current = setTimeout(onTimeout, graceMs)
    }, warnMs)
  }, [clearTimers, onWarn, onTimeout, warnMs, graceMs])

  const handleActivity = useCallback(() => {
    if (warned.current) {
      onActivity()
    }
    reset()
  }, [onActivity, reset])

  useEffect(() => {
    reset()
    EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    return () => {
      clearTimers()
      EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
    }
  }, [reset, handleActivity, clearTimers])
}
