# Brex (brex.com) — Design Audit

Captured live from the site (computed styles + screenshots), not guessed. Structured to mirror `design.md` (the Owo-mi baseline) for easy comparison once you've picked what to borrow.

## 1. Colour

| Value                     | Hex                                                                           | Usage                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orange (brand accent)     | `#FF3D00`                                                                     | The one saturated colour on the site. Every primary CTA, links ("Learn more →", "Explore Brex bill pay"), active tab underline, small icon accents (flight-route dots/line, checkmarks)  |
| Near-black                | `#15191E`                                                                     | All headline/body text on light backgrounds — not pure black                                                                                                                             |
| Off-black (dark sections) | `#000710` / `#0B0D12`-ish                                                     | Footer and hero-transition backgrounds — footer is near-black, not navy or brown                                                                                                         |
| Light warm gray           | `#F3F3F7`                                                                     | Section backgrounds (trust strip, feature-tile wrappers)                                                                                                                                 |
| Lighter gray              | `#F9F9FB`                                                                     | Alternate/subtler section background, close to white                                                                                                                                     |
| Amber/peach               | `#FFB258`                                                                     | Gradient accent behind hero product photography (soft peach-orange gradient, not flat)                                                                                                   |
| Lavender-gray             | ~`#E7E7F2` (sampled visually, not DOM-confirmed)                              | Card backgrounds behind mini product-UI mockups (invoice card, AWS bill-pay card) — a distinctly cooler gray than the warm `#F3F3F7`, used specifically as a "canvas" for UI screenshots |
| Soft green pill           | light green bg / dark green text (Tailwind-ish, e.g. `~#DCFCE7` / `~#15803D`) | Status badge: "✓ In policy"                                                                                                                                                              |
| Soft purple pill          | light purple bg / purple text (e.g. `~#EDE9FE` / `~#7C3AED`)                  | Status badge: "✦ Receipt"                                                                                                                                                                |
| Grayscale logos           | mid-gray, ~40-50% black                                                       | Trust-strip customer logo grid (TikTok, OpenAI, Plaid, Reddit, Anthropic, etc.) — all desaturated to one gray so no third-party brand colour competes with the orange                    |

**Pattern:** near-monochrome (black/white/gray) base + a single hot accent colour (`#FF3D00`) used with real restraint — it appears on CTAs, links, and a handful of icon/line accents, never as a large fill. Photography backgrounds (peach gradient, saturated orange textured fabric behind the phone shot) are where the palette gets warm/loud — colour lives in imagery, not UI chrome. Small semantic status pills (green/purple) appear only inside product-UI mockups, not in marketing chrome itself.

## 2. Typography

- **Primary typeface:** Inter, for everything — headlines, body, nav, buttons, labels. No Google-Fonts-default look to it because of tight tracking and specific weight choices, not a different face.
- **Weights in use:** 400 (body/labels), 500 (headlines — h1 is `font-weight: 500`, not 700/800 like most SaaS sites), 600 (occasional emphasis). Notably restrained — no heavy 800/900 display weight anywhere.
- **H1 (hero):** 48px, weight 500, `line-height: 48px` (1:1, very tight), `letter-spacing: -0.96px` (~-2%), color `#15191E`. Reads as bold mostly because of the tight leading/tracking, not font-weight.
- **Body/paragraph:** small relative to headline — the trust-bar announcement text sampled at 12px. Large gap between headline size and body size is a deliberate hierarchy device throughout (huge black headline, small muted-gray paragraph directly under it).
- **Secondary/display typeface — "Flecha":** a licensed serif, appears exactly once in the sections captured: customer-testimonial quotes ("_Brex's global cards allow us to analyze spend across our entities..._"), set at 36px, elegant/editorial, black text on the light-gray section background. This is the one deliberate typographic surprise on an otherwise all-sans-serif, all-Inter site — used specifically to make quotes feel human/editorial rather than corporate.
- Monospace-styled treatment (likely Inter with letter-spacing + uppercase, not a real mono face) shows up for route codes ("PHX", "AUS") and data labels ("BALANCE DUE") inside product-UI mockups — a data/technical register cue, contained to mockup content only.

## 3. Shape & elevation

- Radii sampled across the page: 3px, 4px, 6px, 7px, 8px, 10px, 12px, 50% (pills/avatars) — a wider, less systematic range than Owo-mi's single-base-radius scale. Buttons ≈10px; larger content cards (feature tiles, testimonial blocks) noticeably more rounded.
- Big rounded-corner image/photo blocks (customer photography, phone mockups) — soft corners even on full-bleed imagery, nothing runs edge-to-edge square.
- No visible shadow system in the sections captured — depth comes from background color contrast (white card on light-gray section, or light-gray card on white section) rather than drop shadows. Flatter than Owo-mi's shadow-driven elevation.

## 4. Layout conventions

- **Nav:** persistent white bar, dropdown mega-menus (Products / Solutions / Resources), plus flat links (Customers, Pricing) and a text "Sign in" + "See a demo" link before the solid orange "Get started" button — three tiers of CTA weight (text link → text link → filled button), not just one primary action.
- **Announcement bar:** thin near-black bar above the nav, centered white text + arrow, first thing you see — a "what's new" hook before any brand messaging.
- **Hero:** left-aligned headline + short subhead + email-capture input inline with the CTA button (not just a bare button) + secondary "See Brex in action" video link. Product visual appears below/beside as photography of a real phone UI, not an illustration.
- **Section rhythm:** alternating full-width statement sections (big centered black headline, e.g. "Trusted by 35,000+ top companies," "Supercharge your financial operations") interleaved with two-column feature rows (headline+copy+link on one side, product-UI mockup card on the other, alternating left/right).
- **Trust/social proof done twice, two ways:** a static grayscale logo grid early (breadth: "35,000+ companies"), and a tabbed, quoted customer-story block later (depth: named customer, serif pull-quote, tab switcher between DoorDash/SeatGeek/Lemonade) — quantity signal up top, qualitative signal further down.
- **Footer:** near-black, four-column link grid (Product/Platform/Company/Resources), logo top-left, social icons + app-store badges along the bottom. Heavier and darker than Owo-mi's footer.
- Extensive legal/compliance fine print block above the footer (banking partner disclosures, FDIC/FINRA/SIPC language) — expected for a regulated fintech, and a pattern Owo-mi will need too given PIPEDA/Law 25 positioning.

## 5. Motion & interaction (not fully audited)

- Not deeply probed this pass (no JS/animation-timeline inspection done) — screenshots don't show obvious scroll-triggered reveals or transitions the way Owo-mi's `reveal-on-scroll`/view-transition theme sweep are explicit in code. If motion matters to the new direction, worth a follow-up pass specifically on interaction (hover states on nav dropdowns, button press feedback, etc.).

## 6. Summary — contrast with current Owo-mi baseline

|                  | Owo-mi (current)                                                 | Brex                                                                           |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Accent colour    | Deep forest green `#0e6b4f`, soft-touch (light bg tints, gentle) | Saturated orange-red `#FF3D00`, higher contrast, more urgent/energetic         |
| Headline weight  | `font-bold` (700)                                                | 500 — tight leading/tracking does the work instead of heavy weight             |
| Typeface variety | One face (Plus Jakarta Sans) for everything                      | One face (Inter) for UI + one serif ("Flecha") reserved for testimonials only  |
| Card elevation   | Soft shadows (`shadow-lg`/`shadow-xl`) drive depth               | Flat — background-color contrast drives depth, no visible shadow layer         |
| Radius           | Single scaled system from one `--radius` base                    | Looser, more varied per-component radii                                        |
| Colour restraint | Green appears fairly often (badges, CTAs, icons, trust strip)    | Orange is rarer/more targeted; color mostly lives in photography, not chrome   |
| Social proof     | None yet structurally                                            | Two distinct proof patterns: logo-grid breadth + tabbed testimonial depth      |
| Voice            | Warm, Canadian-identity-forward (🍁, bilingual nav)              | Confident, enterprise-scale ("35,000+ top companies," Fortune-brand logo wall) |

The biggest borrowable ideas, independent of colour: the tight-leading/medium-weight headline treatment (bold _feels_ without heavy font-weight), the single reserved serif moment for testimonials, and the two-tier trust-proof pattern (logo wall + tabbed quotes).
