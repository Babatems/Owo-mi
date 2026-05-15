import Papa from 'papaparse'
import { detectFormat } from './detect-format'
import type { ParseResult, NormalizedRow, BankFormat } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function dollarsToCents(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null
  const cleaned = value.replace(/[$,\s]/g, '').replace('−', '-')
  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

function parseDate(raw: string, format: BankFormat): string | null {
  if (!raw || !raw.trim()) return null
  const s = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // YYYYMMDD (BMO)
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy && format === 'desjardins')
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`

  // "Jan. 2 2024" or "Jan 2 2024" (Scotiabank)
  const months: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  }
  const longDate = s.match(/^(\w{3})\.?\s+(\d{1,2})\s+(\d{4})/)
  if (longDate) {
    const mo = months[longDate[1].toLowerCase()]
    if (mo) return `${longDate[3]}-${mo}-${longDate[2].padStart(2, '0')}`
  }

  return null
}

function col(row: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().trim().replace(/['"]/g, '') === name.toLowerCase()
    )
    if (key !== undefined) return row[key] ?? ''
  }
  return ''
}

// ── Bank parsers ──────────────────────────────────────────────────────────────

function parseRBC(data: Record<string, string>[]): { rows: NormalizedRow[]; errors: string[] } {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Transaction Date'), 'rbc')
    const desc = [col(r, 'Description 1'), col(r, 'Description 2')].filter(Boolean).join(' ').trim()
    const cadRaw = col(r, 'CAD$')
    const amountCents = dollarsToCents(cadRaw)
    if (!date || amountCents === null || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseTD(data: Record<string, string>[]): { rows: NormalizedRow[]; errors: string[] } {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Date'), 'td')
    const desc = col(r, 'Description')
    const debit = dollarsToCents(col(r, 'Debit'))
    const credit = dollarsToCents(col(r, 'Credit'))
    if (!date || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    let amountCents: number
    if (credit !== null && credit !== 0) amountCents = credit
    else if (debit !== null && debit !== 0) amountCents = -Math.abs(debit)
    else continue
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseScotiabank(data: Record<string, string>[]): {
  rows: NormalizedRow[]
  errors: string[]
} {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Date'), 'scotiabank')
    const desc = col(r, 'Description')
    const withdrawal = dollarsToCents(col(r, 'Withdrawals', 'Withdrawal'))
    const deposit = dollarsToCents(col(r, 'Deposits', 'Deposit'))
    if (!date || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    let amountCents: number
    if (deposit !== null && deposit !== 0) amountCents = Math.abs(deposit)
    else if (withdrawal !== null && withdrawal !== 0) amountCents = -Math.abs(withdrawal)
    else continue
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseBMO(data: Record<string, string>[]): { rows: NormalizedRow[]; errors: string[] } {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Date Posted', 'Date'), 'bmo')
    const desc = col(r, 'Description')
    const amountCents = dollarsToCents(col(r, 'Transaction Amount', 'Amount'))
    if (!date || amountCents === null || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseTangerine(data: Record<string, string>[]): {
  rows: NormalizedRow[]
  errors: string[]
} {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Date'), 'tangerine')
    const desc =
      [col(r, 'Name'), col(r, 'Memo')].filter(Boolean).join(' — ').trim() || col(r, 'Transaction')
    const amountCents = dollarsToCents(col(r, 'Amount'))
    if (!date || amountCents === null || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseDesjardins(data: Record<string, string>[]): {
  rows: NormalizedRow[]
  errors: string[]
} {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const date = parseDate(col(r, 'Date'), 'desjardins')
    const desc = col(r, 'Description', 'Libellé', 'Libelle')
    const debit = dollarsToCents(col(r, 'Débit', 'Retrait', 'Debit', 'Withdrawal'))
    const credit = dollarsToCents(col(r, 'Dépôt', 'Depot', 'Credit', 'Deposit'))
    if (!date || !desc) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    let amountCents: number
    if (credit !== null && credit !== 0) amountCents = Math.abs(credit)
    else if (debit !== null && debit !== 0) amountCents = -Math.abs(debit)
    else continue
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

function parseGeneric(data: Record<string, string>[]): { rows: NormalizedRow[]; errors: string[] } {
  const rows: NormalizedRow[] = []
  const errors: string[] = []
  for (const r of data) {
    const keys = Object.keys(r)
    // Try to find date, description, amount columns by common names
    const dateKey = keys.find((k) => /date/i.test(k))
    const descKey = keys.find((k) => /desc|memo|narr|name|payee/i.test(k))
    const amountKey = keys.find((k) => /amount|amt|value/i.test(k))
    if (!dateKey || !descKey || !amountKey) {
      errors.push(`Could not map columns for row: ${JSON.stringify(r)}`)
      continue
    }
    const date = parseDate(r[dateKey] ?? '', 'generic')
    const desc = r[descKey]?.trim()
    const amountCents = dollarsToCents(r[amountKey])
    if (!date || !desc || amountCents === null) {
      errors.push(`Skipped row: ${JSON.stringify(r)}`)
      continue
    }
    rows.push({ date, description: desc, amountCents, rawLine: JSON.stringify(r) })
  }
  return { rows, errors }
}

// ── Main entry ────────────────────────────────────────────────────────────────

export function parseCSV(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  const headers = (parsed as Papa.ParseResult<Record<string, string>>).meta.fields ?? []
  const { bank, label: bankLabel } = detectFormat(headers)

  const castParsed = parsed as Papa.ParseResult<Record<string, string>>
  let result: { rows: NormalizedRow[]; errors: string[] }
  switch (bank) {
    case 'rbc':
      result = parseRBC(castParsed.data)
      break
    case 'td':
      result = parseTD(castParsed.data)
      break
    case 'scotiabank':
      result = parseScotiabank(castParsed.data)
      break
    case 'bmo':
      result = parseBMO(castParsed.data)
      break
    case 'tangerine':
      result = parseTangerine(castParsed.data)
      break
    case 'desjardins':
      result = parseDesjardins(castParsed.data)
      break
    case 'cibc':
      result = parseGeneric(castParsed.data)
      break
    default:
      result = parseGeneric(castParsed.data)
  }

  return { bank, bankLabel, ...result }
}
