import type { BankFormat } from './types'

export type FormatInfo = { bank: BankFormat; label: string }

export function detectFormat(headers: string[]): FormatInfo {
  const h = headers.map((s) => s.toLowerCase().trim().replace(/['"]/g, ''))

  if (h.includes('transaction date') && h.includes('description 1') && h.some((x) => x === 'cad$'))
    return { bank: 'rbc', label: 'RBC' }

  if (
    h.includes('date posted') &&
    h.includes('transaction amount') &&
    h.includes('transaction type')
  )
    return { bank: 'bmo', label: 'BMO' }

  if (h.includes('transaction') && h.includes('name') && h.includes('memo') && h.includes('amount'))
    return { bank: 'tangerine', label: 'Tangerine' }

  if (
    (h.includes('débit') || h.includes('retrait') || h.includes('retraits')) &&
    h.includes('dépôt')
  )
    return { bank: 'desjardins', label: 'Desjardins' }

  if (h.includes('debit') && h.includes('credit') && h.includes('balance') && h.includes('date'))
    return { bank: 'td', label: 'TD Bank' }

  if (
    (h.includes('withdrawals') || h.includes('withdrawal')) &&
    (h.includes('deposits') || h.includes('deposit'))
  )
    return { bank: 'scotiabank', label: 'Scotiabank' }

  return { bank: 'generic', label: 'Generic CSV' }
}
