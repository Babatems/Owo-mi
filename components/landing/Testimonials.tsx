import { getTranslations } from 'next-intl/server'
import { Star } from 'lucide-react'

type LongTestimonial = {
  name: string
  location: string
  since: string
  quote: string
}

type ShortQuote = {
  name: string
  location: string
  quote: string
}

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      ))}
    </div>
  )
}

function LongCard({ testimonial }: { testimonial: LongTestimonial }) {
  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200/70 bg-white p-6 dark:border-neutral-700/60 dark:bg-neutral-900">
      <StarRating />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <footer className="mt-5 flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
          aria-hidden="true"
        >
          {testimonial.name[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            {testimonial.name}
          </p>
          <p className="text-xs text-neutral-400">
            {testimonial.location} · Member since {testimonial.since}
          </p>
        </div>
      </footer>
    </article>
  )
}

function ShortCard({ quote }: { quote: ShortQuote }) {
  return (
    <article className="rounded-xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-700/60 dark:bg-neutral-900">
      <StarRating />
      <blockquote className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>
      <footer className="mt-3">
        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{quote.name}</p>
        <p className="text-xs text-neutral-400">{quote.location}</p>
      </footer>
    </article>
  )
}

export async function Testimonials() {
  const t = await getTranslations('testimonials')

  const longItems = t.raw('items') as LongTestimonial[]
  const shortItems = t.raw('shortQuotes') as ShortQuote[]

  return (
    <section
      className="bg-neutral-50/60 py-20 sm:py-28 dark:bg-neutral-950/40"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p
            className="mb-2 text-sm font-semibold tracking-wider uppercase"
            style={{ color: 'var(--brand)' }}
          >
            {t('sectionLabel')}
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold tracking-tight text-[var(--navy)] sm:text-4xl dark:text-white"
          >
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500 dark:text-neutral-400">
            {t('subheadline')}
          </p>
        </div>

        {/* 3 long testimonials */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {longItems.map((item) => (
            <LongCard key={item.name} testimonial={item} />
          ))}
        </div>

        {/* Short quote masonry */}
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {shortItems.map((q) => (
            <div key={q.name} className="mb-4 break-inside-avoid">
              <ShortCard quote={q} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
