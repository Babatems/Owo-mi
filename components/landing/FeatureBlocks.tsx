import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

type FeatureBlockProps = {
  label: string
  headline: string
  body: string
  imageSrc: string
  imageAlt: string
  reversed?: boolean
}

function FeatureBlock({ label, headline, body, imageSrc, imageAlt, reversed }: FeatureBlockProps) {
  return (
    <div className="reveal-on-scroll grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
      <div className={reversed ? 'lg:order-2 lg:col-span-5' : 'lg:order-1 lg:col-span-5'}>
        <p
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: 'var(--brand)' }}
        >
          {label}
        </p>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-3xl dark:text-white">
          {headline}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
          {body}
        </p>
        <Link
          href="/sign-up"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--brand)' }}
        >
          Get started free <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className={reversed ? 'lg:order-1 lg:col-span-7' : 'lg:order-2 lg:col-span-7'}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1670}
          height={941}
          className="w-full rounded-2xl"
        />
      </div>
    </div>
  )
}

export async function FeatureBlocks() {
  const t = await getTranslations('features')

  return (
    <section
      id="features"
      className="py-20 sm:py-28"
      aria-labelledby="features-heading"
      style={{ scrollMarginTop: '4rem' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <p
            className="mb-2 text-sm font-semibold tracking-wider uppercase"
            style={{ color: 'var(--brand)' }}
          >
            {t('sectionLabel')}
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-[var(--navy)] sm:text-4xl dark:text-white"
          >
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-500 dark:text-neutral-400">
            {t('subheadline')}
          </p>
        </div>

        <div className="space-y-24">
          <FeatureBlock
            label={t('block1.label')}
            headline={t('block1.headline')}
            body={t('block1.body')}
            imageSrc="/images/landing_page/csv-upload-illustration.png"
            imageAlt="Uploading a bank statement CSV to import transactions"
          />
          <FeatureBlock
            label={t('block2.label')}
            headline={t('block2.headline')}
            body={t('block2.body')}
            imageSrc="/images/landing_page/goals-illustrations.png"
            imageAlt="Savings goals with progress tracking"
            reversed
          />
          <FeatureBlock
            label={t('block3.label')}
            headline={t('block3.headline')}
            body={t('block3.body')}
            imageSrc="/images/landing_page/improved-budget-illustration.png"
            imageAlt="Monthly budgets with category breakdown and an over-budget alert"
          />
          <FeatureBlock
            label={t('block4.label')}
            headline={t('block4.headline')}
            body={t('block4.body')}
            imageSrc="/images/landing_page/account-illustration.png"
            imageAlt="Multiple Canadian bank accounts — chequing, savings, and credit — in one view"
            reversed
          />
        </div>
      </div>
    </section>
  )
}
