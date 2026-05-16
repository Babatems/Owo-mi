'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/lib/actions/settings'

const CONFIRM_WORD = 'DELETE'

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (isPending) return
    setOpen(next)
    if (!next) {
      setConfirmText('')
      setError(undefined)
    }
  }

  function handleDelete() {
    if (confirmText !== CONFIRM_WORD) return
    setError(undefined)
    startTransition(async () => {
      const result = await deleteAccount()
      if (!result.success) {
        setError(result.error)
        return
      }
      // Hard navigate to bust the session cookie cache and fully clear React state
      window.location.replace('/en')
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
      >
        Delete my account
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <DialogTitle>Delete account permanently?</DialogTitle>
            <DialogDescription>
              This will erase your profile, all financial accounts, every transaction, budgets,
              goals, categories, and all other data. This action{' '}
              <span className="font-medium text-neutral-800">cannot be undone</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete" className="text-sm text-neutral-700">
              Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              disabled={isPending}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || isPending}
            >
              {isPending ? 'Deleting…' : 'Delete everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
