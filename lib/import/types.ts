export type BankFormat =
  | 'rbc'
  | 'td'
  | 'scotiabank'
  | 'bmo'
  | 'tangerine'
  | 'desjardins'
  | 'cibc'
  | 'generic'

export type NormalizedRow = {
  date: string // YYYY-MM-DD
  description: string
  amountCents: number // negative = expense, positive = income
  rawLine: string // original CSV line for debugging
}

export type ValidationReport = {
  openingBalanceCents: number | null
  closingBalanceCents: number | null
  computedClosingCents: number | null
  discrepancyCents: number | null
  isBalanced: boolean
  statementPeriod: string | null
}

export type ParseResult = {
  bank: BankFormat
  bankLabel: string
  rows: NormalizedRow[]
  errors: string[]
  validationReport?: ValidationReport
}
