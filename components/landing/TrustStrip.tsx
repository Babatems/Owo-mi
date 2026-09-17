import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

const BANKS = [
  { name: 'RBC', src: '/images/landing_page/banks/rbc.svg', width: 120 },
  { name: 'TD', src: '/images/landing_page/banks/td.svg', width: 216 },
  { name: 'Scotiabank', src: '/images/landing_page/banks/scotiabank.svg', width: 324 },
  { name: 'CIBC', src: '/images/landing_page/banks/cibc.svg', width: 288 },
  { name: 'BMO', src: '/images/landing_page/banks/bmo.svg', width: 324 },
]

export async function TrustStrip() {
  const t = await getTranslations('trust')

  return (
    <section
      className="reveal-on-scroll border-y border-neutral-200/60 dark:border-neutral-800/60"
      aria-label="Bank compatibility"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          {t('sectionLabel')}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10 sm:gap-x-20">
          {BANKS.map(({ name, src, width }) => (
            <li key={name} className="flex items-center">
              <Image
                src={src}
                alt={name}
                width={width}
                height={96}
                className="h-20 w-auto object-contain sm:h-24"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
