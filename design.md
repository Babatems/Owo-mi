# Owó-mi — Current Design Audit

Snapshot of the existing visual system, captured before starting the new landing page design. This is a description of what's live today (`app/globals.css`, `components/landing/*`, `app/[locale]/layout.tsx`), not a spec — use it as the "before" baseline once the inspo `design.md` arrives.

## 1. Colour

### Brand palette (custom CSS vars, `app/globals.css:121-129`)

| Token                 | Value                         | Usage                                                                                            |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `--brand`             | `#0e6b4f` (deep forest green) | Primary CTA fill, links, icon accents, active states — the one colour doing all the "brand" work |
| `--brand-light`       | `#e8f5ef`                     | Badge/pill backgrounds ("Built in Canada" chip)                                                  |
| `--brand-fg`          | `#ffffff`                     | Text-on-brand (defined, barely used explicitly — most CTAs just use `text-white`)                |
| `--marketing-bg`      | `#fafaf7`                     | Marketing pages' body background (warm off-white, not pure white)                                |
| `--marketing-bg-dark` | `#0e0f12`                     | Dark-mode marketing background                                                                   |
| `--navy`              | `#16213e`                     | Heading colour in hero (`text-[var(--navy)]`) — used sparingly, only spotted once                |
| `--lime`              | `#c7f23d`                     | **Defined but unused** — no references found in any component. Leftover/planned accent.          |

### shadcn/base-ui system tokens (OKLCH, `app/globals.css:52-119`)

Fully neutral/grayscale — zero hue. `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--ring`, `--chart-1..5` are all `oklch(x 0 0)` (pure gray ramps), light and dark variants defined. This is the shadcn "neutral" base color (`components.json` → `baseColor: "neutral"`). The brand green is layered on top via inline `style={{ backgroundColor: 'var(--brand)' }}` rather than being wired into the token system (e.g. `--primary` is still gray, not green).

### Ad-hoc chart/data colours (hardcoded hex in `FeatureBento.tsx`)

Spend-category and budget visualizations use their own palette, independent of the CSS vars: `#10B981` (emerald), `#F59E0B` (amber), `#6366F1` (indigo), `#EF4444` (red), `#EC4899` (pink), `#D1D5DB` (gray), plus `#0e6b4f` (brand green) reused directly as a literal. Not consolidated with `--chart-1..5`.

### Observations

- Effectively a **single-accent system**: one green, everything else neutral gray.
- Brand colour is applied via inline `style` + CSS var almost everywhere, not Tailwind utility classes or the shadcn `--primary` token — a rebrand means find/replacing `var(--brand)` across ~10 files rather than editing one line.
- `--navy` and `--lime` suggest a richer palette was planned (navy for headings, lime for pop/accent) but never fully executed — worth deciding whether the new design revives or drops these.
- No warm/error/success colour tokens beyond shadcn's default `--destructive` (a muted red-orange).

## 2. Typography

### Fonts (`next/font/google`, declared in every layout — `app/[locale]/layout.tsx:1-23`)

- **Sans / body / heading:** Plus Jakarta Sans — weights 300–700, `display: swap`, mapped to `--font-jakarta` → `--font-sans` and `--font-heading` (same font for both, no separate display face).
- **Mono:** IBM Plex Mono — weights 400/500 → `--font-mono`. Likely for tabular numerals / currency figures per `CLAUDE.md`'s "tabular numerals for currency" rule, though not confirmed in landing components (no explicit `font-mono` sighted in hero/bento).

### Scale (from hero, the largest sample)

- H1: `text-4xl` → `sm:text-5xl` → `lg:text-[3.5rem]`, `font-bold`, `leading-[1.1]`, `tracking-tight`
- Body/subhead: `text-lg`, `leading-relaxed`, `text-neutral-600` (light) / `text-neutral-300` (dark)
- Nav/logo: `text-base font-semibold tracking-tight`
- Micro (badges, trust strip, footer links): `text-xs font-medium`
- CTA buttons: `text-base font-semibold` (primary) / `text-base font-medium` (secondary)

### Observations

- Single typeface for everything — no serif or secondary display font. Very "SaaS neutral."
- Heavy reliance on `font-semibold`/`font-bold` for hierarchy rather than size jumps — a fairly flat, compact scale.
- No fluid/clamp() type — breakpoint-based `sm:`/`lg:` steps only, except the one arbitrary `lg:text-[3.5rem]`.

## 3. Shape & elevation

- **Radius:** driven by a single `--radius: 0.625rem` (10px) base, scaled via `--radius-sm/md/lg/xl/2xl/3xl/4xl` multipliers (0.6×–2.6×). In practice, landing components mostly use `rounded-xl` / `rounded-2xl` (cards, CTAs) and `rounded-full` (pills, avatars/icons) directly rather than the semantic scale.
- **Borders:** hairline, low-opacity neutrals almost everywhere — `border-neutral-200/70` (light) / `border-neutral-700/60` (dark). No heavy borders or hard black strokes.
- **Shadows:** cards escalate from `shadow-sm` (buttons) → `shadow-lg` (hover states) → `shadow-xl`/`shadow-2xl` (hero dashboard mockup, elevated cards). Shadows are soft, no hard-edge/brutalist offset shadows.
- **Backdrop blur:** nav and mobile sticky CTA use `backdrop-blur-md`/`backdrop-blur-sm` over semi-transparent backgrounds — glassmorphism-lite on scroll.

## 4. Motion

- `reveal-on-scroll` utility (`globals.css:161-175`): scroll-driven `animation-timeline: view()` fade+rise-up (`translateY(20px)→0`, opacity 0→1), applied per-section. Has a `@supports not` fallback to just show content — good progressive enhancement, no JS observer needed.
- **Theme toggle:** View Transitions API circle-sweep from the click point (`theme-sweep`/`theme-sweep-out` keyframes, `globals.css:189-232`) — a genuinely distinctive touch, not a generic fade.
- Micro-interactions: `hover:opacity-90 active:scale-[0.98]` on buttons (press feedback), `hover:shadow-lg` on bento cards, standard `transition-all duration-200`.
- Respects `prefers-reduced-motion: reduce` globally (animation durations collapsed to near-zero).

## 5. Layout conventions

- Max container width: `max-w-6xl` (1152px) consistently across Nav, Hero, TrustStrip, FeatureBento.
- Horizontal padding: `px-4 sm:px-6`.
- Section vertical rhythm: `py-20 sm:py-28` for major sections; hero gets asymmetric `pt-28 pb-16 sm:pt-36 sm:pb-24` to clear the fixed nav.
- Grid patterns: 2-col hero (text + visual) collapsing to stacked on mobile; bento-style asymmetric card grid for features; divided flex row for trust strip (`lg:divide-x`).
- Fixed nav (h-16) becomes opaque+blurred only after `scrollY > 10` — starts fully transparent over the hero.
- Mobile gets a persistent bottom sticky CTA bar (safe-area aware), separate from the in-flow hero CTA — a deliberate mobile-conversion pattern, not just responsive reflow.

## 6. Content/brand voice signals (from copy + structure)

- Name stylized as **"Owó-mi"** (with acute accent) in UI, vs. "Owo-mi" in repo/docs — worth confirming which is canonical for the new design.
- Tagline: "Finally know where your money goes." / FR: "Votre argent. En entier. Enfin clair."
- Canadian identity is a first-class design element, not just a footnote: 🍁 emoji badge in hero ("Built in Canada"), dedicated TrustStrip section (encryption, data-in-Canada, read-only access, privacy, "built in Canada" with a `Leaf` icon), bilingual EN/FR routing built into the nav itself.
- Icon library: `lucide-react` throughout (Sun/Moon, Menu/X, ShieldCheck, MapPin, Eye, FileCheck, Leaf, Wallet, Target, CreditCard, Languages, TrendingDown) — consistent line-icon style, no custom icon set.
- Sections present today, top to bottom: Nav → Hero (+ live dashboard mockup visual) → TrustStrip → FeatureBento → FeatureBlocks → Testimonials → FAQ → FinalCTA → Footer.

## 7. Summary — what a rebrand touches

1. **One real brand colour** (`--brand` green) applied via inline styles/CSS vars in ~8-10 component files, not through the shadcn token system — so a colour change is a targeted but multi-file edit, not a one-line token swap (unless we take this chance to wire it into `--primary`).
2. **Two unused/underused tokens** (`--navy`, `--lime`) already sitting in `globals.css` — decide keep, repurpose, or delete.
3. **Typography is a single typeface** (Plus Jakarta Sans) doing all jobs — a new design could introduce a display/serif pairing for more distinctive headlines, or keep it minimal.
4. **Shape language is soft/rounded/low-contrast** (generous radius, hairline borders, soft shadows) — a more editorial or brutalist inspo would be a meaningful departure, not a tweak.
5. Motion system (scroll reveal + view-transition theme sweep) is reusable infrastructure independent of visual style — likely worth keeping regardless of new direction.
