import { getTranslations } from 'next-intl/server'
import { ShieldCheck, MapPin, Eye, FileCheck, Leaf } from 'lucide-react'

const TRUST_ITEMS = [
  { key: 'encryption' as const, Icon: ShieldCheck },
  { key: 'dataCanada' as const, Icon: MapPin },
  { key: 'readOnly' as const, Icon: Eye },
  { key: 'privacy' as const, Icon: FileCheck },
  { key: 'builtCanada' as const, Icon: Leaf },
]

export async function TrustStrip() {
  const t = await getTranslations('trust')

  return (
    <section
      className="reveal-on-scroll border-y border-neutral-200/60 dark:border-neutral-800/60"
      aria-label="Trust signals"
    >
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-neutral-200/60 dark:lg:divide-neutral-800/60">
          {TRUST_ITEMS.map(({ key, Icon }) => (
            <li key={key} className="flex items-center justify-center gap-2 py-1 lg:px-6">
              <Icon
                className="size-4 shrink-0"
                style={{ color: 'var(--brand)' }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
