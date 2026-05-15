'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { parseCSV } from '@/lib/import/parse'
import { bulkImportTransactions } from '@/lib/actions/import'
import type { NormalizedRow, ParseResult, ValidationReport } from '@/lib/import/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Currency } from '@/components/ui/currency'
import { formatDate } from '@/lib/utils/dates'
import { Upload, CheckCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Account = { id: string; name: string; type: string }

interface ImportWizardProps {
  accounts: Account[]
}

type Step = 'upload' | 'preview' | 'done'

export function ImportWizard({ accounts }: ImportWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(
    null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function processFile(file: File) {
    setError(undefined)
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

    if (!isPdf) {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Please upload a CSV or PDF file.')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const result = parseCSV(text)
          if (result.rows.length === 0) {
            setError('No transactions found in this file. Check the format and try again.')
            return
          }
          setParseResult(result)
          setValidationReport(null)
          setSelected(new Set(result.rows.map((_, i) => i)))
          setError(undefined)
          setStep('preview')
        } catch {
          setError('Failed to parse CSV. Make sure it is a valid CSV file from your bank.')
        }
      }
      reader.readAsText(file)
      return
    }

    // PDF branch — server-side parsing
    setPdfLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import/parse-pdf', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'Failed to parse PDF.')
        return
      }
      const result = (await res.json()) as ParseResult
      if (result.rows.length === 0) {
        setError(
          result.errors[0] ?? 'No transactions found in this PDF. The format may not be supported.'
        )
        return
      }
      setParseResult(result)
      setValidationReport(result.validationReport ?? null)
      setSelected(new Set(result.rows.map((_, i) => i)))
      setError(undefined)
      setStep('preview')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) void processFile(file)
    },

    []
  )

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }

  function toggleRow(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (!parseResult) return
    if (selected.size === parseResult.rows.length) setSelected(new Set())
    else setSelected(new Set(parseResult.rows.map((_, i) => i)))
  }

  async function handleImport() {
    if (!parseResult || !accountId) return
    setLoading(true)
    setError(undefined)
    const rows: NormalizedRow[] = Array.from(selected).map((i) => parseResult.rows[i])
    const result = await bulkImportTransactions({ accountId, rows })
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setImportResult(result.data)
    setStep('done')
  }

  // ── Step: Upload ─────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Import Transactions</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Upload a CSV export from your bank to bulk-import transactions.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Account</Label>
          <Select value={accountId} onValueChange={(v) => v && setAccountId(v)}>
            <SelectTrigger className="w-64">
              <span className="text-sm">
                {accounts.find((a) => a.id === accountId)?.name ?? 'Select account'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors',
            isDragging
              ? 'border-neutral-400 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
          )}
          onClick={() => document.getElementById('bank-statement-input')?.click()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
            <Upload className="size-5 text-neutral-500" />
          </div>
          <div>
            <p className="font-medium text-neutral-700">Drop your bank statement here</p>
            <p className="mt-0.5 text-sm text-neutral-400">CSV or PDF · or click to browse</p>
          </div>
          <p className="text-xs text-neutral-400">
            CSV: RBC, TD, Scotiabank, BMO, Tangerine, Desjardins · PDF: RBC, TD, CIBC, BMO,
            Scotiabank
          </p>
          <input
            id="bank-statement-input"
            type="file"
            accept=".csv,text/csv,.pdf,application/pdf"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {pdfLoading && (
          <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
            <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            Parsing PDF…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── Step: Preview ────────────────────────────────────────────────────────

  if (step === 'preview' && parseResult) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => {
              setStep('upload')
              setParseResult(null)
              setValidationReport(null)
            }}
            className="mb-2 -ml-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <h1 className="text-xl font-semibold text-neutral-900">Review Transactions</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Detected: <span className="font-medium text-neutral-700">{parseResult.bankLabel}</span>
            {' · '}
            <span className="text-emerald-600">{selected.size} selected</span>
            {' of '}
            {parseResult.rows.length} transactions
          </p>
        </div>

        {validationReport && (
          <div
            className={cn(
              'rounded-lg border px-4 py-3 text-sm',
              validationReport.isBalanced
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : validationReport.discrepancyCents !== null
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                {validationReport.statementPeriod && (
                  <p className="font-medium">{validationReport.statementPeriod}</p>
                )}
                {validationReport.openingBalanceCents !== null && (
                  <p>
                    Opening: <Currency cents={validationReport.openingBalanceCents} />
                  </p>
                )}
                {validationReport.closingBalanceCents !== null && (
                  <p>
                    Closing: <Currency cents={validationReport.closingBalanceCents} />
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {validationReport.isBalanced ? (
                  <span className="flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle className="size-4" /> Balanced
                  </span>
                ) : validationReport.discrepancyCents !== null ? (
                  <span className="flex items-center gap-1 font-medium text-amber-700">
                    <AlertCircle className="size-4" />
                    Discrepancy: <Currency cents={validationReport.discrepancyCents} />
                  </span>
                ) : (
                  <span className="text-neutral-400">Balance check unavailable</span>
                )}
              </div>
            </div>
          </div>
        )}

        <Card className="border-neutral-200">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
              <input
                type="checkbox"
                checked={selected.size === parseResult.rows.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span className="w-24 shrink-0">Date</span>
              <span className="flex-1">Description</span>
              <span className="w-24 text-right">Amount</span>
            </div>

            {/* Rows */}
            <div className="max-h-[400px] overflow-y-auto">
              {parseResult.rows.map((row, i) => (
                <div
                  key={i}
                  onClick={() => toggleRow(i)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 border-b border-neutral-50 px-4 py-2.5 text-sm last:border-0',
                    selected.has(i) ? 'bg-white' : 'bg-neutral-50 opacity-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleRow(i)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="w-24 shrink-0 text-neutral-400">
                    {formatDate(new Date(row.date), 'short')}
                  </span>
                  <span className="flex-1 truncate text-neutral-800">{row.description}</span>
                  <span
                    className={cn(
                      'w-24 text-right font-medium',
                      row.amountCents < 0 ? 'text-red-600' : 'text-emerald-600'
                    )}
                  >
                    <Currency cents={row.amountCents} colorCode showSign />
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {parseResult.errors.length > 0 && (
          <p className="text-xs text-amber-600">
            {parseResult.errors.length} row{parseResult.errors.length !== 1 ? 's' : ''} skipped due
            to parse errors.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <Button className="w-full" onClick={handleImport} disabled={loading || selected.size === 0}>
          {loading
            ? 'Importing…'
            : `Import ${selected.size} transaction${selected.size !== 1 ? 's' : ''}`}
        </Button>
      </div>
    )
  }

  // ── Step: Done ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="size-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Import complete</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {importResult?.imported ?? 0} transaction{importResult?.imported !== 1 ? 's' : ''}{' '}
          imported
          {(importResult?.skipped ?? 0) > 0 && (
            <span>
              {' '}
              · {importResult?.skipped} duplicate{importResult?.skipped !== 1 ? 's' : ''} skipped
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setStep('upload')
            setParseResult(null)
            setImportResult(null)
            setValidationReport(null)
          }}
        >
          <FileText className="mr-2 size-4" />
          Import another file
        </Button>
        <Button className="flex-1" onClick={() => router.push('/transactions')}>
          View transactions
        </Button>
      </div>
    </div>
  )
}
