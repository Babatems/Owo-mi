export type BankFormat =
  | 'rbc'
  | 'td'
  | 'scotiabank'
  | 'bmo'
  | 'tangerine'
  | 'desjardins'
  | 'generic'

export type NormalizedRow = {
  date: string // YYYY-MM-DD
  description: string
  amountCents: number // negative = expense, positive = income
  rawLine: string // original CSV line for debugging
}

export type ParseResult = {
  bank: BankFormat
  bankLabel: string
  rows: NormalizedRow[]
  errors: string[]
}
