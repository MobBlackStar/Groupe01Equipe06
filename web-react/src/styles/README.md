# CampusSave × Griddle — Page Author Guide

The web UI copies the look of the Framer **Griddle** reference site
(`../framergribble.framer.website`, served with `node serve.js` on :3000).
Every class below is defined in `griddleTheme.css`. Tailwind is still used for
layout (grid/flex/gap/spacing), but **colour, type and components come from these
primitives**, so the screens stay consistent.

## 1. Palette (Tailwind `cs-*` or the hex values)

| Token | Hex | Use |
|---|---|---|
| `cs-cream` | `#FAF3E6` | page canvas (never white pages) |
| `cs-biscuit` | `#EDE6D7` | cards, tiles, panels |
| `cs-sand` | `#E2D8C5` | dividers / pressed state on biscuit |
| `cs-ink` | `#111111` | text, 2px outlines, dark panels |
| `cs-muted` | `#5E5850` | secondary text (only on cream/biscuit) |
| `cs-red` | `#DA0711` | primary CTA, prices, active states |
| `cs-mustard` | `#FFD000` | stickers, highlights, points |
| `cs-leaf` | `#1F7A3A` | success / eco only |

**Banned:** dark SaaS surfaces (`#0D0F12`, `#161920`, `#16191E`, slate/zinc/gray-9xx
backgrounds), neon `#CCFF00`, Tailwind default blues/purples/greens as surfaces,
glassmorphism, `backdrop-blur` panels, gradients on cards, 1px hairline borders
as decoration, harsh offset "brutalist" shadows.

## 2. Type scale. Nothing on screen below 13px.

| Class | Font | Size | Use |
|---|---|---|---|
| `cs-hero` | League Gothic | 68→180px | one per landing screen ("CUISINÉ. BRADÉ. SAUVÉ.") |
| `cs-display` | League Gothic | 56→104px | **every page opens with one** (page title) |
| `cs-title` | Bowlby One SC | 28→40px | section titles ("NOS PÉPITES") |
| `cs-title-lg` | Bowlby One SC | 36→64px | big section titles / overlay on photo tiles |
| `cs-h3` | Oswald 700 | 22px upper | card titles, item names |
| `cs-lead` | Oswald 400 | 18→24px | intro paragraph under a title |
| `cs-body` | Oswald 300 | 18px | paragraphs |
| `cs-eyebrow` | Oswald 600 | 14px red upper | kicker above a title |
| `cs-label` | Oswald 600 | 13px muted upper | field/stat labels |
| `cs-figure` | League Gothic | set size with text-[..] | prices, KPI numbers |
| `cs-stat-value` | League Gothic | 44→60px | KPI number inside `cs-stat` |
| `cs-marker` | Permanent Marker | — | polaroid captions, handwritten asides |
| `cs-mono` | Space Mono | — | receipts, ticket codes, order refs |
| `font-sticker` | Knewave | — | inside `cs-sticker` |

Tailwind font utilities: `font-display`, `font-title`, `font-sans` (Oswald),
`font-sticker`, `font-marker`, `font-mono`. `font-anton` is a legacy alias for
Oswald 600; don't use it in new code.

**Never use** `text-[7px]` … `text-[12px]`, and never `text-xs` for content.
The minimum is `text-[13px]`/`cs-label`; body copy is `text-base`/`text-lg`.

## 3. Layout rhythm

```jsx
<div className="cs-container cs-page">          {/* max 1360px, generous gutters */}
  <header className="mb-10 lg:mb-14">
    <p className="cs-eyebrow mb-3">Espace étudiant</p>
    <h1 className="cs-display">Mes tickets</h1>
    <p className="cs-lead mt-4 max-w-2xl">Short intro sentence.</p>
  </header>
  <section className="mb-16">
    <div className="flex items-end justify-between gap-6 mb-8">
      <h2 className="cs-title">Section</h2>
      <Link className="cs-btn cs-btn-cream cs-btn-sm">Voir tout →</Link>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">…</div>
  </section>
</div>
```

* Gaps between cards: `gap-6` (24px) minimum. Card padding: `p-6`–`p-8`.
* Sections are separated by **space** (`mb-16`–`mb-24`), not by boxes inside boxes.
  Don't nest a biscuit card inside a biscuit card.
* Full-bleed accents: the red ticker ribbon (`cs-ticker`), photo tiles, ink panels (`cs-card-ink`).

## 4. Components

**Buttons** (2px ink outline pills, 52px tall):
`cs-btn cs-btn-red` (primary) · `cs-btn cs-btn-cream` (secondary) · `cs-btn cs-btn-ink`
· `cs-btn cs-btn-mustard` · sizes `cs-btn-sm` (40px) / `cs-btn-lg` (60px) / `cs-btn-block`.
Round icon button: `cs-icon-btn`. Underlined text link: `cs-link`.
The `<Button variant=… size=…>` component maps to the same classes.

**Surfaces:** `cs-card` (biscuit, r=20px, no border) · `cs-card-paper` (white + 2px ink)
· `cs-card-ink` (black panel, cream text) · add `cs-card-hover` for lift on hover.

**Photos must fill their frame:**
```jsx
<div className="cs-photo cs-photo-zoom aspect-[4/3]">
  <img src={url} alt={title} loading="lazy" />
</div>
```
`cs-photo` makes the `<img>` absolutely positioned with `object-fit: cover`. **Never**
`object-contain`, `max-h-*` thumbnails floating in a box, or padding around a photo.
Photo tile with overlay title: add `cs-photo-tile` and put
`<h3 className="cs-title-lg text-white absolute inset-0 grid place-items-center z-10">`.

**Stickers:** `cs-sticker cs-sticker-red|mustard|ink` (Knewave oval, rotated, white
outline) for "NOUVEAU", "-50%", "HOT". `cs-dot-badge` for "#1".
**Status pills:** `cs-pill` + `cs-pill-red|mustard|ink|leaf|outline` (or `<Badge>`).
**Chips / segmented filters:** `<button className="cs-chip" aria-pressed={active}>` (or `<Tabs>`).

**Forms:** `cs-field-label` + `cs-input` (pill, 52px, white, 2px ink; also works on
`<select>` and `<textarea>`) + `cs-error-text` / `cs-help-text`.
Or `<Input>`, `<Select>` from `components/ui`.

**Stats:** `<div className="cs-stat"><span className="cs-label">Repas sauvés</span><span className="cs-stat-value">12</span></div>`

**Tables:** `<table className="cs-table">`, wrapped in `cs-card p-2 overflow-x-auto`.

**Receipts / tickets:** `cs-receipt` (white paper, torn bottom edge, Space Mono) +
`cs-receipt-rule` dashed separators. **Polaroid:** `cs-polaroid` + `<figcaption>` + `rs-tape-tl`.
**Stamp:** `cs-stamp`. **Ticker:** see `features/explore/BrowsePage.jsx`.

## 5. Data display: zero tolerance

* Money: `formatTND(millimes)` from `@shared/money.js`. If the value is missing or
  non-finite, render `—`. **Never** show `0,000 DT`, `NaN`, or `undefined`.
* Dates/times: `formatTunisDate`, `formatTunisTime`, `formatTunisTimeWindow` from
  `lib/formatters.js`. **Never** render an ISO string (`2026-11-18T…`).
* Profile points live in `profile.ecoPoints` (not `ecoPointsBalance`).
* Long names: allow 2 lines (`line-clamp-2`) rather than truncating to "Baguette Far…".

## 6. Motion

Hover: cards lift (`cs-card-hover`), photos zoom (`cs-photo-zoom`), buttons rise 2px.
Entrance: `cs-fade-up` with `style={{ animationDelay: `${i * 60}ms` }}`. Respect
`prefers-reduced-motion` (already handled in CSS).

## 7. Housekeeping

* Keep each file's 3-line `// 💡 / 🔄 / 🎯` defense header comment.
* Do not change data fetching, hooks, routes, API calls, props or business logic.
  This is a presentation-layer overhaul.
* Mobile first: check 375px. No horizontal scroll, tap targets ≥ 44px.
