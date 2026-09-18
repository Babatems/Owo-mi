import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Star } from 'lucide-react'

type Testimonial = {
  name: string
  location: string
  since: string
  avatar: string
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

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="flex h-full w-[340px] shrink-0 flex-col rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm sm:w-[380px] dark:border-neutral-700/60 dark:bg-neutral-900">
      <StarRating />
      <blockquote className="mt-4 flex-1 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <footer className="mt-5 flex items-center gap-3">
        <Image
          src={`/images/landing_page/testimonials/${testimonial.avatar}`}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full object-cover"
        />
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

export async function Testimonials() {
  const t = await getTranslations('testimonials')

  const items = t.raw('items') as Testimonial[]
  // Duplicated so the track can loop seamlessly at the -50% mark.
  const loopItems = [...items, ...items]

  return (
    <section
      className="reveal-on-scroll bg-neutral-50/60 py-20 sm:py-28 dark:bg-neutral-950/40"
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
      </div>

      <div
        className="w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        <div
          className="marquee-track flex w-max gap-5 px-4 sm:px-6"
          style={{ willChange: 'transform' }}
        >
          {loopItems.map((item, i) => (
            <TestimonialCard key={`${item.name}-${i}`} testimonial={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
