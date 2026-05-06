import { formatCents, isNegative } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

interface CurrencyProps {
  cents: number
  currency?: string
  className?: string
  showSign?: boolean
  colorCode?: boolean
}

export function Currency({
  cents,
  currency = 'CAD',
  className,
  showSign = false,
  colorCode = false,
}: CurrencyProps) {
  const negative = isNegative(cents)
  const formatted = formatCents(cents, currency)
  const sign = showSign && cents > 0 ? '+' : ''

  return (
    <span
      className={cn(
        'font-mono [font-variant-numeric:tabular-nums]',
        colorCode && negative && 'text-red-600',
        colorCode && !negative && cents !== 0 && 'text-emerald-600',
        className
      )}
    >
      {sign}
      {formatted}
    </span>
  )
}
