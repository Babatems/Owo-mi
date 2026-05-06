export function formatCents(cents: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const float = parseFloat(cleaned)
  if (isNaN(float)) return 0
  return Math.round(float * 100)
}

export function centsToDisplay(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2)
}

export function isNegative(cents: number): boolean {
  return cents < 0
}
