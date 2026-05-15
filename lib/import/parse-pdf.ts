import PDFParser from 'pdf2json'
import type { ParseResult, NormalizedRow, BankFormat, ValidationReport } from './types'

// ── pdf2json output types ─────────────────────────────────────────────────────

type PDFTextRun = { T: string }
type PDFText = { x: number; y: number; R: PDFTextRun[] }
type PDFPage = { Texts: PDFText[] }
type PDFData = { Pages: PDFPage[] }

// ── Internal coordinate types ─────────────────────────────────────────────────

type TextFragment = { x: number; y: number; text: string }
type LogicalRow = { y: number; cells: string[] }
type InternalRow = { y: number; cells: Array<{ x: number; text: string }> }

// ── Coordinate grouping ───────────────────────────────────────────────────────

const Y_TOLERANCE = 0.5 // pdf2json "page units" — ~0.5 PU ≈ half a line at 9–10pt

function extractFragments(pages: PDFPage[]): TextFragment[] {
  const frags: TextFragment[] = []
  for (const page of pages) {
    for (const t of page.Texts) {
      const text = t.R.map((r) => decodeURIComponent(r.T))
        .join('')
        .trim()
      if (text) frags.push({ x: t.x, y: t.y, text })
    }
  }
  return frags
}

function groupIntoRows(frags: TextFragment[]): LogicalRow[] {
  const sorted = [...frags].sort((a, b) => a.y - b.y)
  const irows: InternalRow[] = []

  for (const frag of sorted) {
    let row = irows.find((r) => Math.abs(r.y - frag.y) <= Y_TOLERANCE)
    if (!row) {
      row = { y: frag.y, cells: [] }
      irows.push(row)
    }
    row.cells.push({ x: frag.x, text: frag.text })
  }

  return irows
    .sort((a, b) => a.y - b.y)
    .map((r) => ({
      y: r.y,
      cells: r.cells.sort((a, b) => a.x - b.x).map((c) => c.text),
    }))
}

// ── pdf2json promise wrapper ──────────────────────────────────────────────────

function parsePdfBuffer(buf: Buffer): Promise<PDFData> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true)
    parser.on('pdfParser_dataReady', (data: PDFData) => {
      resolve(data)
      ;(parser as unknown as { destroy?: () => void }).destroy?.()
    })
    parser.on('pdfParser_dataError', (err: { parserError: Error } | Error) => {
      reject('parserError' in err ? err.parserError : err)
    })
    parser.parseBuffer(buf)
  })
}

// ── Bank fingerprinting ───────────────────────────────────────────────────────

const BANK_TOKENS: Array<{ bank: BankFormat; label: string; tokens: RegExp[] }> = [
  { bank: 'rbc', label: 'RBC', tokens: [/royal bank/i, /\bRBC\b/] },
  { bank: 'td', label: 'TD Bank', tokens: [/TD Canada Trust/i, /\bTD Bank\b/i] },
  { bank: 'cibc', label: 'CIBC', tokens: [/\bCIBC\b/] },
  { bank: 'bmo', label: 'BMO', tokens: [/Bank of Montreal/i, /\bBMO\b/] },
  { bank: 'scotiabank', label: 'Scotiabank', tokens: [/scotiabank/i, /banque scotia/i] },
  { bank: 'desjardins', label: 'Desjardins', tokens: [/desjardins/i] },
  { bank: 'tangerine', label: 'Tangerine', tokens: [/tangerine/i] },
]

function fingerprintBank(text: string): { bank: BankFormat; bankLabel: string } {
  for (const entry of BANK_TOKENS) {
    if (entry.tokens.some((re) => re.test(text))) {
      return { bank: entry.bank, bankLabel: entry.label }
    }
  }
  return { bank: 'generic', bankLabel: 'Unknown Bank' }
}

// ── Statement period and year inference ──────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
  // French equivalents
  janv: 0,
  févr: 1,
  mars: 2,
  avr: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  août: 7,
  sept: 8,
  déc: 11,
}

function parseMonthName(s: string): number | null {
  const key = s.slice(0, 4).toLowerCase().replace('.', '')
  return MONTH_NAMES[key] ?? null
}

function extractPeriod(rows: LogicalRow[]): {
  year: number | null
  endMonth: number | null
  periodLabel: string | null
} {
  const text = rows
    .slice(0, 30)
    .map((r) => r.cells.join(' '))
    .join(' ')

  const m = text.match(/(\w+\.?\s+\d{1,2})[,\s–\-to]+(\w+\.?\s+\d{1,2})[,\s]+(\d{4})/i)
  if (m) {
    const year = parseInt(m[3], 10)
    const endMonth = parseMonthName(m[2])
    return { year, endMonth, periodLabel: m[0].trim() }
  }

  const yearM = text.match(/\b(20\d{2})\b/)
  if (yearM) return { year: parseInt(yearM[1], 10), endMonth: null, periodLabel: null }
  return { year: null, endMonth: null, periodLabel: null }
}

function inferYear(rowMonth: number, stmtYear: number, endMonth: number | null): number {
  // December rows in a Jan-ending statement belong to the prior year
  if (endMonth !== null && endMonth <= 1 && rowMonth >= 11) return stmtYear - 1
  return stmtYear
}

// ── Amount helpers ────────────────────────────────────────────────────────────

function pdfDollarsToCents(raw: string): number | null {
  if (!raw || raw.trim() === '' || raw.trim() === '-') return null
  const cleaned = raw.replace(/[$,\s]/g, '').replace('−', '-')
  const n = parseFloat(cleaned)
  if (isNaN(n)) return null
  return Math.round(n * 100)
}

function extractLastAmount(cells: string[]): number | null {
  for (let i = cells.length - 1; i >= 0; i--) {
    const v = pdfDollarsToCents(cells[i] ?? '')
    if (v !== null) return v
  }
  return null
}

// ── BankProfile interface ─────────────────────────────────────────────────────

interface BankProfile {
  bank: BankFormat
  bankLabel: string
  parseRows(
    rows: LogicalRow[],
    period: { year: number | null; endMonth: number | null }
  ): { rows: NormalizedRow[]; errors: string[] }
  extractBalances(rows: LogicalRow[]): { openingCents: number | null; closingCents: number | null }
}

// ── Shared balance extractor ──────────────────────────────────────────────────

function extractCommonBalances(rows: LogicalRow[]): {
  openingCents: number | null
  closingCents: number | null
} {
  let openingCents: number | null = null
  let closingCents: number | null = null
  for (const row of rows) {
    const cells = row.cells
    const text = cells.join(' ')
    // Prefer "$X.XX" formatted cells (summary style used by Scotiabank),
    // fall back to the last plain decimal (used by RBC/TD/CIBC/BMO)
    const dollarCell = cells.find((c) => /^\$[\d,]+\.\d{2}$/.test(c ?? ''))
    const isOpening =
      /opening balance|previous balance|solde d.ouverture/i.test(text) ||
      (cells.some((c) => /^opening$/i.test(c ?? '')) &&
        cells.some((c) => /^balance$/i.test(c ?? '')))
    const isClosing =
      /closing balance|new balance|solde de fermeture/i.test(text) ||
      (cells.some((c) => /^closing$/i.test(c ?? '')) &&
        cells.some((c) => /^balance$/i.test(c ?? '')))
    if (isOpening)
      openingCents = dollarCell ? pdfDollarsToCents(dollarCell) : extractLastAmount(cells)
    if (isClosing)
      closingCents = dollarCell ? pdfDollarsToCents(dollarCell) : extractLastAmount(cells)
  }
  return { openingCents, closingCents }
}

// ── CIBC chequing profile ─────────────────────────────────────────────────────

const cibcProfile: BankProfile = {
  bank: 'cibc',
  bankLabel: 'CIBC',
  parseRows(rows, _period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    for (const row of rows) {
      const dateMatch = row.cells[0]?.match(/^(\d{4}-\d{2}-\d{2})$/)
      if (!dateMatch) continue
      const date = dateMatch[1]
      const description = row.cells[1]?.trim() ?? ''
      if (!description) continue
      const withdrawalCents = pdfDollarsToCents(row.cells[2] ?? '')
      const depositCents = pdfDollarsToCents(row.cells[3] ?? '')
      let amountCents: number
      if (depositCents !== null && depositCents !== 0) amountCents = depositCents
      else if (withdrawalCents !== null && withdrawalCents !== 0)
        amountCents = -Math.abs(withdrawalCents)
      else continue
      result.push({ date, description, amountCents, rawLine: JSON.stringify(row.cells) })
    }
    return { rows: result, errors }
  },
  extractBalances: extractCommonBalances,
}

// ── RBC chequing profile ──────────────────────────────────────────────────────

const rbcChequingProfile: BankProfile = {
  bank: 'rbc',
  bankLabel: 'RBC',
  parseRows(rows, period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    const year = period.year ?? new Date().getFullYear()
    for (const row of rows) {
      // Date: "6 Jul" or "15 Dec"
      const dateMatch = row.cells[0]?.match(/^(\d{1,2})\s+([A-Za-z]{3})$/)
      if (!dateMatch) continue
      const monthIdx = parseMonthName(dateMatch[2])
      if (monthIdx === null) continue
      const inferredYear = inferYear(monthIdx, year, period.endMonth)
      const date = `${inferredYear}-${String(monthIdx + 1).padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`
      const description = row.cells[1]?.trim() ?? ''
      if (!description) continue
      const withdrawalCents = pdfDollarsToCents(row.cells[2] ?? '')
      const depositCents = pdfDollarsToCents(row.cells[3] ?? '')
      let amountCents: number
      if (depositCents !== null && depositCents !== 0) amountCents = depositCents
      else if (withdrawalCents !== null && withdrawalCents !== 0)
        amountCents = -Math.abs(withdrawalCents)
      else continue
      result.push({ date, description, amountCents, rawLine: JSON.stringify(row.cells) })
    }
    return { rows: result, errors }
  },
  extractBalances: extractCommonBalances,
}

// ── RBC Visa profile ──────────────────────────────────────────────────────────

const rbcVisaProfile: BankProfile = {
  bank: 'rbc',
  bankLabel: 'RBC Visa',
  parseRows(rows, period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    const year = period.year ?? new Date().getFullYear()
    for (const row of rows) {
      // Trans Date: "Jul 6" (MMM DD)
      const dateMatch = row.cells[0]?.match(/^([A-Za-z]{3})\s+(\d{1,2})$/)
      if (!dateMatch) continue
      const monthIdx = parseMonthName(dateMatch[1])
      if (monthIdx === null) continue
      const inferredYear = inferYear(monthIdx, year, period.endMonth)
      const date = `${inferredYear}-${String(monthIdx + 1).padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
      // cells[1] = post date (skip), cells[2] = description, cells[3] = amount
      const description = row.cells[2]?.trim() ?? ''
      if (!description) continue
      const rawAmount = pdfDollarsToCents(row.cells[3] ?? '')
      if (rawAmount === null) continue
      // Positive amount = charge (expense), negative = payment/credit
      const amountCents = rawAmount > 0 ? -rawAmount : Math.abs(rawAmount)
      result.push({ date, description, amountCents, rawLine: JSON.stringify(row.cells) })
    }
    return { rows: result, errors }
  },
  extractBalances: extractCommonBalances,
}

// ── TD chequing profile ───────────────────────────────────────────────────────

const tdProfile: BankProfile = {
  bank: 'td',
  bankLabel: 'TD Bank',
  parseRows(rows, period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    const year = period.year ?? new Date().getFullYear()
    for (const row of rows) {
      // TD uses "MMM DD" e.g. "Jan 15"
      const dateMatch =
        row.cells[0]?.match(/^([A-Za-z]{3})\s+(\d{1,2})$/) ??
        row.cells[0]?.match(/^(\d{1,2})\s+([A-Za-z]{3})$/)
      if (!dateMatch) continue
      // Determine which capture group is the month
      let monthIdx: number | null
      let day: string
      const firstIsAlpha = /^[A-Za-z]/.test(dateMatch[1])
      if (firstIsAlpha) {
        monthIdx = parseMonthName(dateMatch[1])
        day = dateMatch[2]
      } else {
        monthIdx = parseMonthName(dateMatch[2])
        day = dateMatch[1]
      }
      if (monthIdx === null) continue
      const inferredYear = inferYear(monthIdx, year, period.endMonth)
      const date = `${inferredYear}-${String(monthIdx + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
      const description = row.cells[1]?.trim() ?? ''
      if (!description) continue
      const withdrawalCents = pdfDollarsToCents(row.cells[2] ?? '')
      const depositCents = pdfDollarsToCents(row.cells[3] ?? '')
      let amountCents: number
      if (depositCents !== null && depositCents !== 0) amountCents = depositCents
      else if (withdrawalCents !== null && withdrawalCents !== 0)
        amountCents = -Math.abs(withdrawalCents)
      else continue
      result.push({ date, description, amountCents, rawLine: JSON.stringify(row.cells) })
    }
    return { rows: result, errors }
  },
  extractBalances: extractCommonBalances,
}

// ── BMO chequing profile ──────────────────────────────────────────────────────

const bmoProfile: BankProfile = {
  bank: 'bmo',
  bankLabel: 'BMO',
  parseRows(rows, period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    const year = period.year ?? new Date().getFullYear()
    for (const row of rows) {
      const dateMatch =
        row.cells[0]?.match(/^([A-Za-z]{3})\s+(\d{1,2})$/) ??
        row.cells[0]?.match(/^(\d{1,2})\s+([A-Za-z]{3})$/)
      if (!dateMatch) continue
      const firstIsAlpha = /^[A-Za-z]/.test(dateMatch[1])
      let monthIdx: number | null
      let day: string
      if (firstIsAlpha) {
        monthIdx = parseMonthName(dateMatch[1])
        day = dateMatch[2]
      } else {
        monthIdx = parseMonthName(dateMatch[2])
        day = dateMatch[1]
      }
      if (monthIdx === null) continue
      const inferredYear = inferYear(monthIdx, year, period.endMonth)
      const date = `${inferredYear}-${String(monthIdx + 1).padStart(2, '0')}-${day.padStart(2, '0')}`
      const description = row.cells[1]?.trim() ?? ''
      if (!description) continue
      const debitCents = pdfDollarsToCents(row.cells[2] ?? '') // Debits column
      const creditCents = pdfDollarsToCents(row.cells[3] ?? '') // Credits column
      let amountCents: number
      if (creditCents !== null && creditCents !== 0) amountCents = creditCents
      else if (debitCents !== null && debitCents !== 0) amountCents = -Math.abs(debitCents)
      else continue
      result.push({ date, description, amountCents, rawLine: JSON.stringify(row.cells) })
    }
    return { rows: result, errors }
  },
  extractBalances: extractCommonBalances,
}

// ── Scotiabank chequing profile ───────────────────────────────────────────────
//
// Scotiabank PDFs have two structural quirks that break the simple cell[0] approach:
//
// 1. SPLIT DATES — month and day are separate cells: ["Mar", "27", ...] not ["Mar 27", ...]
//    The month may not be at cells[0] due to prefix noise from page numbers / reference codes.
//
// 2. TWO-COLUMN LAYOUT — the first page renders sidebar content (contact info, account summary)
//    at the same y-coordinates as the transaction rows. This contaminates cells with words like
//    "Your Basic Banking account summary", phone numbers, and URLs.
//
// Fix: scan the whole cells array for a month abbreviation, then locate the day as the next
// 1-2 digit numeric cell. Collect amounts as pure decimal values after the day. Filter noise
// from the description using a blocklist of boilerplate words. Determine sign from description
// keywords (deposit/payroll → credit; everything else → debit).

const SCOTIA_MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i
const SCOTIA_DECIMAL_RE = /^\d{1,3}(?:,\d{3})*\.\d{2}$/
// Words that come from the right-column sidebar, not from the transaction description
const SCOTIA_NOISE_RE =
  /^(your|basic|banking|account|summary|for|online|access|call|questions|amounts|here|what|happened|minus|plus|total|deposited|withdrawals|continued|number|www|free|monthly|fees|balance|on|closing|opening|january|february|march|april|june|july|august|september|october|november|december)$/i

const scotiaProfile: BankProfile = {
  bank: 'scotiabank',
  bankLabel: 'Scotiabank',

  parseRows(rows, period) {
    const result: NormalizedRow[] = []
    const errors: string[] = []
    const year = period.year ?? new Date().getFullYear()

    for (const row of rows) {
      const cells = row.cells

      // 1. Find first month abbreviation anywhere in the row
      const monthCellIdx = cells.findIndex((c) => SCOTIA_MONTH_RE.test(c ?? ''))
      if (monthCellIdx === -1) continue

      // 2. Find the next 1-2 digit numeric cell within the next 4 positions (the day)
      let dayCellIdx = -1
      for (let i = monthCellIdx + 1; i < Math.min(cells.length, monthCellIdx + 5); i++) {
        if (/^\d{1,2}$/.test(cells[i] ?? '')) {
          dayCellIdx = i
          break
        }
      }
      if (dayCellIdx === -1) continue

      // 3. Collect all plain decimal amounts after the day (no $ prefix, no thousands-only)
      const amounts: Array<{ idx: number; cents: number }> = []
      for (let i = dayCellIdx + 1; i < cells.length; i++) {
        const c = cells[i] ?? ''
        if (SCOTIA_DECIMAL_RE.test(c)) {
          const cents = pdfDollarsToCents(c)
          if (cents !== null) amounts.push({ idx: i, cents })
        }
      }

      // Need at least: txn amount + running balance
      if (amounts.length < 2) continue

      const balanceCents = amounts[amounts.length - 1].cents
      const txnAmountCents = amounts[amounts.length - 2].cents

      // 4. Build description from cells between day and first amount, stripping noise
      const firstAmtIdx = amounts[0].idx
      const description = cells
        .slice(dayCellIdx + 1, firstAmtIdx)
        .filter((c) => {
          if (!c || c.length <= 1) return false
          if (/^[-–—|]+$/.test(c)) return false // dashes / pipes
          if (/^\d+$/.test(c)) return false // bare reference numbers
          if (/^\d{1,2}[,.]?$/.test(c)) return false // short date fragments like "9,"
          if (/^20\d{2}[,.]?$/.test(c)) return false // year fragments like "2026"
          if (SCOTIA_NOISE_RE.test(c)) return false // sidebar boilerplate
          if (c.includes('.com') || c.includes('.ca')) return false
          if (/^\(?\d{3}\)?$/.test(c)) return false // phone fragments like "(1" or "800"
          return true
        })
        .join(' ')
        .trim()

      if (!description) continue
      if (/opening balance|closing balance/i.test(description)) continue

      // 5. Determine credit vs debit from description keywords
      const isCredit = /\bdeposit|dep\b|payroll|salary|\bcredit\b|refund|interest earned/i.test(
        description
      )
      const signedAmount = isCredit ? txnAmountCents : -txnAmountCents

      // 6. Build date
      const monthNum = parseMonthName(cells[monthCellIdx] ?? '')
      if (monthNum === null) continue
      const dayStr = cells[dayCellIdx] ?? ''
      const inferredYear = inferYear(monthNum, year, period.endMonth)
      const date = `${inferredYear}-${String(monthNum + 1).padStart(2, '0')}-${dayStr.padStart(2, '0')}`

      result.push({ date, description, amountCents: signedAmount, rawLine: JSON.stringify(cells) })
    }

    return { rows: result, errors }
  },

  extractBalances: extractCommonBalances,
}

// ── Profile registry ──────────────────────────────────────────────────────────

function selectProfile(bank: BankFormat, headerText: string): BankProfile | null {
  if (bank === 'rbc') {
    return /visa|mastercard/i.test(headerText) ? rbcVisaProfile : rbcChequingProfile
  }
  const map: Partial<Record<BankFormat, BankProfile>> = {
    cibc: cibcProfile,
    td: tdProfile,
    bmo: bmoProfile,
    scotiabank: scotiaProfile,
  }
  return map[bank] ?? null
}

// ── Balance reconciliation ────────────────────────────────────────────────────

function buildValidationReport(
  profile: BankProfile,
  allRows: LogicalRow[],
  normalizedRows: NormalizedRow[],
  periodLabel: string | null
): ValidationReport {
  const { openingCents, closingCents } = profile.extractBalances(allRows)
  let computedClosingCents: number | null = null
  if (openingCents !== null) {
    const delta = normalizedRows.reduce((sum, r) => sum + r.amountCents, 0)
    computedClosingCents = openingCents + delta
  }
  const discrepancyCents =
    closingCents !== null && computedClosingCents !== null
      ? Math.abs(closingCents - computedClosingCents)
      : null
  return {
    openingBalanceCents: openingCents,
    closingBalanceCents: closingCents,
    computedClosingCents,
    discrepancyCents,
    isBalanced: discrepancyCents === 0,
    statementPeriod: periodLabel,
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function parsePDF(buf: Buffer): Promise<ParseResult> {
  const data = await parsePdfBuffer(buf)
  const pages = data.Pages
  if (!pages?.length) {
    return { bank: 'generic', bankLabel: 'Unknown Bank', rows: [], errors: ['PDF has no pages'] }
  }

  const allRows = pages.flatMap((page) => groupIntoRows(extractFragments([page])))
  const headerText = allRows
    .slice(0, 30)
    .map((r) => r.cells.join(' '))
    .join('\n')

  const { bank, bankLabel } = fingerprintBank(headerText)
  const period = extractPeriod(allRows)
  const profile = selectProfile(bank, headerText)

  if (!profile) {
    return {
      bank,
      bankLabel,
      rows: [],
      errors: [
        `No PDF parser implemented for ${bankLabel}. Please use the CSV export from your bank instead.`,
      ],
    }
  }

  const { rows, errors } = profile.parseRows(allRows, {
    year: period.year,
    endMonth: period.endMonth,
  })

  const validationReport = buildValidationReport(profile, allRows, rows, period.periodLabel)
  return { bank, bankLabel, rows, errors, validationReport }
}
