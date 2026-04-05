# Design System — JamBets

## Product Context
- **What this is:** A peer-to-peer prediction market for jam band concert setlists. Users write betting lines ("Will Tweezer open Set II?"), set odds, and find opponents who take the other side. The setlist settles it.
- **Who it's for:** Obsessive jam band fans — phans, heads, tapers — who argue about setlists in group chats and want skin in the game.
- **Space/industry:** Prediction markets + jam band community. Peer: DraftKings (mainstream sports betting), Kalshi (fintech prediction markets), Phish.net (fan archive). Niche is completely un-served.
- **Project type:** Mobile-first web app (Next.js App Router)

## Aesthetic Direction
- **Direction:** "Warm Vault" — a concert venue at night crossed with a vintage setlist archive. Looks like it was built by someone who has followed 200 shows.
- **Decoration level:** Intentional — subtle grain texture overlay, no blobs, no gradients, no decorative elements. Data is the decoration. Setlist notation is the visual grammar.
- **Mood:** Underground, obsessive, intimate. The app should feel like a dark venue — warm, focused, exclusive to people who know. Not a casino, not a startup, not a fintech product.
- **Key differentiator:** Every mainstream prediction market tries to look legitimate by appearing financial or sporty. For the jam band audience, legitimacy comes from demonstrated cultural knowledge — the design itself must prove the builders are phans.

## Logo
- **Direction:** Option 1 — Fraunces italic wordmark
- **Spec:** "JamBets" set in Fraunces 700 italic, -0.02em tracking
  - "Jam" in `#7C3AED` (violet)
  - "Bets" in `#F0EAD6` (cream text), font-size slightly smaller than "Jam"
- **Usage:** Sticky header (21px), auth screens (28px), favicon (use the "J" initial)
- **App icon:** The italic "J" from Fraunces in violet, on a `#0C0A07` background with an 8px border-radius square

## Typography

- **Display/Hero:** [Fraunces](https://fonts.google.com/specimen/Fraunces) — italic, optical serif. Used for page titles, market questions in emphasis, hero copy.
  - Rationale: No betting or prediction market app uses a serif. Fraunces is "wonky" — designed for optical character at large sizes, with warmth and personality. Signals cultural sophistication, not athleticism. Completely distinctive in this competitive space.
  - Weights used: 400 (regular italic), 600 (semibold italic), 700 (bold italic)
  - Settings: `font-style: italic`, `letter-spacing: -0.02em` to `-0.03em` at display sizes

- **Body/UI:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — humanist sans-serif. Used for all body copy, labels, navigation, form inputs, buttons.
  - Rationale: Clean, readable at 14-15px. Humanist construction (based on hand lettering) adds warmth without competing with Fraunces. Strong at small label sizes.
  - Weights used: 400 (body), 500 (labels, nav), 600 (buttons, emphasis)

- **Data/Tables/Setlist:** [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) — monospace. Used for: odds percentages, dollar amounts, setlist notation (> segues, SET I/II labels), show dates, gap counts.
  - Rationale: Tabular numbers for odds alignment. The mono aesthetic references setlist archives (Phish.net, .setlists). Makes the product feel like it was built with data precision in mind.
  - Always use `font-variant-numeric: tabular-nums`
  - Weights: 400 (data), 500 (prominent figures)

- **Loading:** Google Fonts CDN with `<link rel="preconnect">` and `display=swap`. Fraunces and DM Sans load together; Geist Mono is a separate request.

- **Type Scale (4px base):**
  ```
  xs:    11px / 1.4  — labels, badges, section headers
  sm:    12px / 1.5  — captions, muted meta, timestamps
  base:  14px / 1.6  — body, form inputs, list items
  md:    15px / 1.6  — primary body text
  lg:    17px / 1.5  — lead paragraph, subheadings
  xl:    20px / 1.3  — section headings (DM Sans 600)
  2xl:   24px / 1.2  — page headings (Fraunces italic)
  3xl:   32px / 1.1  — hero subheadings (Fraunces italic)
  4xl:   48px / 1.05 — display / hero (Fraunces italic)
  ```

- **Line measure:** 60–70 characters for body paragraphs. `max-width: ~520px` on text-heavy blocks.

## Color

- **Approach:** Restrained — 1 primary accent (violet) + 1 secondary (green) + neutrals. Color is rare and meaningful. The warm dark backgrounds carry the visual weight.

- **Primary (violet):** `#7C3AED` — violet-600
  - Usage: logo "Jam," primary CTA buttons, OPEN badge, creator-pick outcome borders, focus rings, active states, accent links
  - Dim version: `rgba(124, 58, 237, 0.12)` for badge backgrounds, hover states

- **Secondary (green):** `#10B981` — emerald-500
  - Usage: success states, LIVE badge, "bet accepted" confirmation, settled/won outcomes, positive amounts

- **Neutrals (warm grays — slight yellow-brown undertone):**
  ```
  --bg:         #0C0A07   warm near-black background (not cold black — a hint of tobacco)
  --surface:    #19160F   card surfaces
  --surface-2:  #232018   elevated surfaces (modals, selected states, input backgrounds)
  --surface-3:  #2E2B1F   hover states, tertiary surfaces
  --text-dim:   #4A4438   very muted / decorative text
  --text-muted: #877C6A   secondary text, labels, timestamps
  --text:       #EDE7D4   primary text (warm cream — not harsh white)
  ```
  - Rationale: Warm near-black (#0C0A07) feels like a concert venue. Pure black (#000000) feels like an airport. This difference is felt even when not consciously noticed.

- **Semantic:**
  - Warning/Pending: `#F59E0B` (amber-400)
  - Error/Dispute: `#F43F5E` (rose-500)
  - Info: `#3B82F6` (blue-500)

- **Border colors:**
  ```
  Default:      rgba(237, 231, 212, 0.07)    very subtle warm white
  Hover:        rgba(237, 231, 212, 0.14)    slightly more visible
  Active/focus: rgba(124, 58, 237, 0.35)     violet tint
  ```

- **Dark mode strategy:** The app is dark-mode only. All surfaces use warm-tinted darks with slight yellow-brown undertone. Text uses cream (#EDE7D4), not pure white.

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable (between compact and spacious — data-rich but not cramped)
- **Scale:**
  ```
  2xs:  4px    (tight internal spacing — icon gaps, badge padding)
  xs:   8px    (form field padding vertical, chip gaps)
  sm:   12px   (card padding, list item spacing)
  md:   16px   (card padding standard, section sub-gaps)
  lg:   24px   (between cards, section headers)
  xl:   32px   (major section breaks)
  2xl:  48px   (section padding vertical)
  3xl:  72px   (page section vertical rhythm)
  ```

## Layout

- **Approach:** Grid-disciplined — strict single column on mobile, constrained max-width on desktop
- **Max content width:** 740px (feed, market pages, forms)
- **Mobile breakpoints:** 375px, 768px, 1024px
- **Border radius:**
  ```
  none / 0:   data cells, outcome bars
  xs: 3px     badges, chips, presets
  sm: 4px     data cards, market outcomes, buttons (sm)
  md: 6px     market cards, buttons, inputs
  lg: 8px     modals, overlays, profile cards
  xl: 12px    honor-code overlay
  full: 9999  pill badges (never use on cards)
  ```
  - **Rule:** Never uniform bubbly radius on everything. Tighter = more data-like. Larger = more human/conversational.

- **Grain texture:** Apply a subtle SVG noise grain overlay (opacity: 0.025–0.03, mix-blend-mode: soft-light) as a fixed `::after` pseudo-element on body. Adds analog texture without visual weight. Invisible at a glance, felt as warmth.

## Motion

- **Approach:** Minimal-functional — only transitions that communicate state change. Nothing animated for decoration.
- **Easing:** `ease-out` for entering, `ease-in` for exiting, `ease-in-out` for position changes
- **Duration scale:**
  ```
  micro:   100ms   (hover state color changes, badge appearance)
  short:   150ms   (button press, card hover border)
  medium:  250ms   (overlay appear, page section fade-in)
  long:    350ms   (success confirmation, bet locked animation)
  ```
- **animate-fade-in:** `opacity: 0 → 1` at 250ms ease-out. Applied to page containers.
- **Never animate:** layout properties (width, height, top, left). Only `transform` and `opacity`.
- **`prefers-reduced-motion`:** All animations must respect this. Use `@media (prefers-reduced-motion: reduce)`.

## Component Notes

### Market Cards
- Background: `var(--surface)` (#19160F)
- Border: `var(--border)` default; `rgba(124, 58, 237, 0.35)` when user has an active bet
- Hover: border transitions to `var(--border-hover)`
- Creator-pick outcome row: violet-tinted border + "TAKEN" label in violet
- Odds bar: 2px height, `rgba(237,231,212,0.22)` fill — never color-coded (avoids color-only encoding)
- Amount/payout display: Geist Mono, aligned right

### Badges
- Never use uniform pill shape — use `border-radius: 3px` (sharp, data-like)
- OPEN: violet on violet-dim background
- TAKEN: dim text on transparent background
- LIVE: green
- PENDING RESULT: amber
- SETTLED: dim text
- VOIDED: dim text

### Honor Code Overlay
- `border-radius: 12px` (most human component in the app — it's a commitment)
- Border: `rgba(124, 58, 237, 0.35)` (violet — gravity)
- Title: Fraunces italic
- Data rows: Geist Mono for values, dim text for labels
- Copy tone: direct, no hedging. "Your word is your bond." Not "Please note that..."

### Show Chips
- Inline context chips on market cards
- Small monospace dot in violet precedes show name
- `border-radius: 3px`, surface-2 background

### Rules Preset Chips
- Available on the create form as quick-insert
- `border-radius: 3px`
- Hover: violet tint border + violet text

### The "Drop a Bet" CTA
- Primary button: `background: #7C3AED`, `color: white`
- Mobile: sticky footer bar with safe-area-inset padding
- On market creation success: "Your bet is live. Copy the link and find someone brave enough to take it."

### Setlist Notation
- Song names: `var(--text)` in Geist Mono
- Segue arrows (>): `var(--accent)` (violet) — they are the key event
- SET I / SET II / E labels: `var(--accent)`, font-weight 600
- Teases indicated by `†` or `[tease]` in brackets

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Fraunces italic for display type | Only jam band prediction market using a serif — creates unmistakable identity |
| 2026-03-23 | Warm near-black (#0C0A07) not pure black | Feels like a concert venue, not an airport |
| 2026-03-23 | Goldenrod rejected; violet retained as primary | User preference — consistency with existing app implementation |
| 2026-03-23 | Geist Mono for all data/odds/setlist | Tabular numbers + archive aesthetic of setlist sites |
| 2026-03-23 | 3px border-radius on badges (not pill) | Data-like, not decorative. Signals precision. |
| 2026-03-23 | Grain texture overlay | Adds analog warmth without visual weight |
| 2026-03-23 | DM Sans for body (not Inter/Roboto) | Humanist construction adds warmth, avoids overused defaults |
| 2026-03-23 | Competitive research: DraftKings, Kalshi, Phish.net, PrizePicks, Phantasy Tour | Research confirmed no product occupies warm-analog + data-density space |
