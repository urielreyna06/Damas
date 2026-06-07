# Handoff: Damas PvE — Frontend Redesign

## Overview
**Damas** is a web-based English draughts (8×8 checkers) game played against an AI with three
difficulties (Easy / Medium / Hard), plus a cosmetic skin marketplace. This package is a complete
visual + interaction redesign of the existing six-view product, in a **dark-luxury** direction
(warm black + amber/gold, Playfair Display headings + Inter body, chess.com-grade board craft with
a touch of Duolingo gamification and Figma cleanliness).

The six views:
1. **Landing / Login** (`index.html`) → route `/`
2. **Play / game selection** (`play.html`) → route `/play`
3. **Game board** (`game.html`) → route `/play/:gameId`
4. **Leaderboard** (`leaderboard.html`) → route `/leaderboard`
5. **Shop / marketplace** (`shop.html`) → route `/shop`
6. **Profile** (`me.html`) → route `/me`

## About the Design Files
The files in this bundle are **design references created in HTML/CSS/vanilla-JS + one React island** —
working prototypes that show the intended look and behavior. **They are not production code to copy
verbatim.** The task is to **recreate these designs inside the target codebase's existing environment**
(the stated stack: **React + TanStack Start, Tailwind CSS, Clerk Auth, Stripe**), using its established
component patterns, routing, data layer, and conventions.

Concretely:
- The **visual design, layout, tokens, copy, and interaction model** are the spec — match them.
- The **checkers rules engine** (`assets/engine.js`) is framework-agnostic, well-tested, and can be
  ported almost as-is (it's pure functions). See *Game Engine* below.
- Auth and payments are **mocked** in the prototype — wire them to real **Clerk** and **Stripe Checkout**.
- Persistence is **localStorage** in the prototype — replace with your real backend / TanStack loaders.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, shadows, motion, and copy are all
intended as shown. Recreate pixel-faithfully using your component library and Tailwind config.
Exact token values are listed under *Design Tokens*.

---

## Design Tokens

> Map these into `tailwind.config.js` (`theme.extend.colors`, `borderRadius`, `boxShadow`,
> `fontFamily`). They are defined as CSS custom properties in `assets/ds.css` (`:root`).

### Color — surfaces (warm near-black, NOT pure neutral)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0E0E12` | page background |
| `--bg-1` | `#16161D` | elevated cards (top of gradient) |
| `--bg-2` | `#1E1E27` | inputs, hover, inner tiles |
| `--bg-3` | `#262630` | deepest chips / progress track |
| `--line` | `rgba(255,255,255,0.08)` | hairline borders |
| `--line-2` | `rgba(255,255,255,0.14)` | stronger borders |

Cards use a subtle vertical gradient: `linear-gradient(180deg, #16161D, #131319)`.
The page has a fixed ambient vignette: gold radial glow top-center + faint green glow bottom-right.

### Color — text
| Token | Hex | Use |
|---|---|---|
| `--text` | `#F4F2EC` | primary (warm white) |
| `--muted` | `#9C9CA8` | secondary |
| `--muted-2` | `#6B6B77` | tertiary / captions |

### Color — gold / amber (primary accent)
| Token | Hex | Use |
|---|---|---|
| `--gold` | `#E3B23C` | accent text, active nav, dots |
| `--gold-hi` | `#F4CB5E` | gradient top of gold buttons |
| `--gold-lo` | `#B7882A` | gradient bottom of gold buttons |
| `--gold-soft` | `rgba(227,178,60,0.14)` | tinted backgrounds (selected) |
| `--gold-line` | `rgba(227,178,60,0.35)` | gold borders / focus rings |

Primary button gradient: `linear-gradient(180deg, #F4CB5E, #B7882A)`, text color `#1A1505`.

### Color — status / difficulty
| Token | Hex | Tint |
|---|---|---|
| `--green` (Easy / win / owned) | `#5BC98A` | `rgba(91,201,138,0.16)` |
| `--amber` (Medium) | `#E3B23C` | `rgba(227,178,60,0.16)` |
| `--red` (Hard / loss / illegal) | `#E5634D` | `rgba(229,99,77,0.16)` |
| Stripe accent (checkout pay button) | `#635BFF` | — |

### Radius
`--r-sm 8px` · `--r 12px` · `--r-lg 18px` · `--r-xl 26px` · pills `999px`.

### Shadow
| Token | Value |
|---|---|
| `--sh-1` | `0 1px 2px rgba(0,0,0,.4)` |
| `--sh-2` | `0 8px 24px -8px rgba(0,0,0,.55)` |
| `--sh-3` | `0 24px 60px -18px rgba(0,0,0,.7)` |
| `--sh-glow` | `0 0 0 1px rgba(227,178,60,.35), 0 10px 40px -10px rgba(227,178,60,.35)` |

### Spacing & layout
- Content max width: **1180px**, horizontal padding **28px** (18px ≤720px).
- Card padding: **24px** (panels 18–22px). Grid gaps: **14–20px**.
- Standard easing: `cubic-bezier(.22,.61,.36,1)` ("--ease"). Page fades 150ms; card hover 200ms.

### Typography
- **Headings / display:** `'Playfair Display'`, weights 500/600/700/800, `letter-spacing: -0.01em`
  (display sizes use `-0.02em`). Serif, elegant.
- **Body / UI:** `'Inter'`, weights 400/500/600/700.
- **Monospace** (game IDs, move notation, numeric cells): system mono stack
  (`'SF Mono', ui-monospace, 'Roboto Mono', monospace`).
- Imported via Google Fonts in `ds.css`.

Type scale in use (px): display 40–68 (clamped), h1 32–40, h2 24–28, section eyebrow 12 (uppercase,
`letter-spacing:.22em`, gold), body 15, small 13.5, caption 12. **Never below 12px.**

### Shared components (in `ds.css`)
- `.btn` + variants: `.btn-gold` (primary), `.btn-ghost` (secondary outline), `.btn-quiet` (text),
  sizes `.btn-sm` / `.btn-lg`, `.btn-block`. Hover lifts `translateY(-2px)`; active `translateY(1px)`.
- `.card` (gradient surface + border + `--sh-2`), `.card-hover` (lift + `--sh-3` on hover).
- `.badge` difficulty pills: `.badge-easy/.badge-medium/.badge-hard` (colored dot + tinted bg),
  `.badge-gold`, `.badge-owned`.
- `.input` (focus → gold ring `0 0 0 3px var(--gold-soft)`), `.pill`, `.skeleton` (shimmer loading),
  `.divider`, `.footer`.
- Focus-visible ring: `2px solid var(--gold)` offset 2px (keyboard a11y, meets the AA-contrast ask).

---

## Navbar (shared chrome)
Sticky, 66px tall, `backdrop-filter: blur(14px)` over `rgba(14,14,18,.72)`, bottom hairline.
- **Left:** brand — a 30px rounded checker glyph (`conic-gradient` 2×2 gold/dark) + "Da**mas**"
  in Playfair (the "mas" is gold).
- **Center:** nav links Play / Leaderboard / Shop (active link is gold; hover gets `--bg-2`).
  Hidden < 720px.
- **Right:** gold "New game" button + circular avatar (initials) linking to `/me`.

On the landing page the right side is instead **Sign in** (quiet) + **Play now** (gold), since the
user is logged out. Build the navbar as one shared component; pass an `active` key.

---

## Screens / Views

### 1. Landing / Login — `index.html` (`/`)
**Purpose:** Convert a visitor to a logged-in player.

**Layout:** Hero is a 2-column grid (`1.05fr .95fr`, gap 48px) inside the 1180px container, 70px top
padding. Collapses to 1 column < 860px (board moves above copy, shrinks to 320px).

**Components:**
- *Hero copy (left):* gold eyebrow "CHECKERS · PLAYER VS AI"; display H1 in two block lines —
  "Train your mind." (white) and "*Beat the machine.*" (gold, italic), `clamp(34px,4.6vw,60px)`,
  line-height 1.04. Tagline (`--muted`, 18px, max 30ch). CTA row: "Play now" (gold lg) + "See the
  difficulties" (ghost lg, anchors to `#difficulties`). Meta row: `3 AI difficulties · 6 board skins ·
  Global leaderboards` (bold numbers, hairline separators).
- *Hero board (right):* a **non-interactive** checkers board rendered from an organic mid-game
  position, tilted `rotateX(46deg) rotateZ(-34deg) scale(1.06)` under `perspective:1600px`, with a
  soft gold radial glow behind and a gentle 7s float animation. A bottom gradient fades it into the bg.
- *Difficulties section (`#difficulties`):* eyebrow + H2 "Three minds to face"; 3 `.diff-card`s
  (Easy/Medium/Hard) each with a difficulty badge (top-right), a tinted glyph, name (Playfair 22px),
  and description. Cards lift on hover and tint to their difficulty color. **Clicking any card opens
  the login modal pre-seeded with that difficulty.**
- *Footer:* hairline, two muted lines.

**Login modal (mock Clerk):** centered card (max 396px) over a `blur(7px)` scrim. Brand glyph, "Welcome
to Damas", email input, gold "Continue", "or" divider, "Continue with Google" (Google 4-color dot),
fine print. Closes on ✕ / backdrop / Esc.
> **Implementation:** Replace with Clerk's `<SignIn>` / `useSignIn`. On success, if a difficulty was
> pre-selected, create a game and route to `/play/:id`; otherwise route to `/play`.

### 2. Play / game selection — `play.html` (`/play`)
**Purpose:** Start a new game or resume one in progress.

**Layout:** Page header (H1 "Play" + subtitle). Then a **New game** card, then the **Your games** section.

**Components:**
- *New game card:* label "NEW GAME · CHOOSE DIFFICULTY"; a 3-up radio group of difficulty cards
  (`role="radiogroup"`, keyboard selectable). Selected card gets gold border + `--sh-glow` + a filled
  gold check (top-right). Below: gold "Start new game" (lg) + helper "You move first, always."
  Default selection: **Medium**.
- *Your games:* section title + "{n} in progress" count. Responsive grid
  (`repeat(auto-fill, minmax(280px,1fr))`) of game cards. **Each card:** a 96px mini board preview of
  the actual position, difficulty badge, ✕ delete button (top-right of body), `{moveCount} moves ·
  {timeAgo}`, gold "Resume" link → `/play/:id`, and a turn hint ("Your turn" / "AI to move").
- *Empty state:* dashed-border panel, a mini board glyph, "No games yet", explanation, and a gold
  "Create your first game" button.

> The prototype **seeds two demo games** on first visit for demonstration; remove that and drive the
> list from your backend / TanStack loader.

### 3. Game board — `game.html` (`/play/:gameId`) — THE CENTERPIECE
> This is the only screen built as a **React island** (see `assets/game.jsx`), because it is highly
> interactive. It defines the design language; everything else echoes it.

**Purpose:** Play a full game of draughts against the AI.

**Layout:** A top bar ("← All games" link + monospace "Game #id"). Then a 2-column grid
(`minmax(0,1fr) 332px`, gap 32px): **board** left (max 624px, centered), **side panel** right.
Collapses to a single column < 920px (board max 520, panel below).

**Board (`assets/board.css`):**
- A `var(--frame)`-colored padded shell (16px pad, 18px radius) with a gold edge ring and deep
  drop shadow. Inside: an 8×8 CSS grid of squares (light `--sq-light`, dark `--sq-dark`), an absolutely
  positioned pieces layer, and optional coordinate labels (files a–h, ranks 1–8).
- **Squares** are the click targets. States: `selsq` (selected piece's square — inset gold ring),
  `lastfrom`/`lastto` (gold tint marking the last move), `hint` (legal non-capture target),
  `hint-cap` (legal capture target — red ring). Hint rendering style is configurable (see Tweaks).
- **Pieces** are absolutely positioned by `top/left: %` (each = 12.5% of the board), giving free,
  GPU-friendly motion. A piece is a `.disc` with a radial-gradient body + layered inset/drop shadows
  for a 3D checker look; kings show a ♔ crown glyph. Player pieces use the skin's `--h1/--h2/--hk`,
  AI pieces use `--a1/--a2/--ak`.
  - *Move animation:* `transition: top/left .29s var(--ease)`. Multi-jumps animate hop-by-hop along
    the path; captured pieces fade+shrink out (`scale(.32) rotate(18deg)`, opacity 0, 300ms).
  - *States:* `.selectable` (own movable piece — pointer + hover lift), `.sel` (selected — gold ring +
    raised), `.shake` (illegal attempt — horizontal shake + red ring, ~420ms), `.dying` (being captured).

**Side panel:**
- *Turn card:* "You" (avatar) vs "Damas AI" (robot mark). The side whose turn it is gets a gold-tinted
  highlight. Status line: "Your move" / "Damas to move" / "Damas is thinking···" (animated dots + a
  pulsing robot while the AI computes) / "Game over".
- *Meta card:* difficulty badge; live "Your pieces" / "AI pieces" counts.
- *History card:* "Move history" — last 5 moves, newest first; each row shows actor, `from → to` in
  algebraic notation (e.g. `c3 → d4`), and `×n` if it captured. Yours are gold-edged, AI's grey-edged.
- *Abandon:* a discreet outlined button. First click reveals a fixed confirm bar ("Abandon this
  game? It counts as a loss." + red confirm); confirming records a loss and routes to `/play`.

**End-of-game modal:** centered over a `blur(6px)` scrim, ~650ms after the final move. Badge (♔ win /
♚ loss / ½ draw), title (Victory / Defeat / Draw), one-line subtitle, then "Play again" (gold, starts
a fresh game at the same difficulty) and "View leaderboard" (ghost → `/leaderboard`).

**Loading / thinking:** the AI "thinking" state is a pulse on the robot + animated dots (not a generic
spinner), satisfying the skeleton/no-spinner requirement. For longer searches, show the board disabled.

### 4. Leaderboard — `leaderboard.html` (`/leaderboard`)
**Purpose:** Show fastest (fewest-move) clean wins per difficulty.

**Layout:** Eyebrow "HALL OF FAME" + H1 "Leaderboard" + subtitle. A segmented **tabs** control
(Easy / Medium / Hard, each with its colored dot; active tab gets `--bg-3`). Below, a table with
`border-spacing: 0 8px` so each row is a separated, rounded "card".

**Components / columns:** Rank · Player · Moves · Duration · Date. (Duration + Date hide < 680px.)
- **Top 3** get medal rank chips: gold (♔ for #1), silver, bronze gradients.
- **Player cell:** circular initials avatar + name (kept on one line).
- **The signed-in user's row** is highlighted with a gold tint + gold border and a "YOU" tag.

> Prototype generates mock rows per difficulty and injects the current user. Replace with real data;
> keep the visual treatment for top-3 and the "you" row.

### 5. Shop / marketplace — `shop.html` (`/shop`)
**Purpose:** Browse and buy cosmetic board skins.

**Layout:** Eyebrow "COSMETICS" + H1 "Board skins" + subtitle; a "{n} owned" pill on the right.
Responsive grid (`minmax(260px,1fr)`) of skin cards.

**Skin card:** a board **preview** (mini board in that skin, scales up slightly on hover), name
(Playfair 20px), uppercase tag (e.g. "WARM"), blurb, and a footer with price + action. Owned skins
show a green "OWNED" banner and an "Equip" link (→ `/me`); the free default shows an "Included" badge;
others show a gold "Buy skin" button.

**Catalog (6 skins — see `assets/shared.js → SKINS`):**
| id | Name | Tag | Price |
|---|---|---|---|
| `emerald` | Emerald Classic | Default | Free (owned) |
| `wood` | Classic Wood | Warm | $2.99 |
| `neon` | Neon Glow | Cyberpunk | $2.99 |
| `marble` | Marble Board | Elegant | $3.99 |
| `vector` | Vector Classic | Minimal | $1.99 |
| `pixel` | Retro Pixel | 8-bit | $0.99 |

**Checkout modal (mock Stripe):** card-styled sheet — header (mini board preview, item name, price),
card-number / expiry / CVC fields, a `#635BFF` "Pay $X" button (→ "Processing…" → success), and a
"Secured by Stripe · test mode" line. Success state: green check, "Purchase complete", "Equip it in
your profile" + "Keep browsing".
> **Implementation:** Replace with real **Stripe Checkout** (redirect or embedded). On webhook/confirm,
> mark the skin owned, then show the success state.

### 6. Profile — `me.html` (`/me`)
**Purpose:** Show identity + stats and let the player equip a skin.

**Layout:** Profile header (76px avatar with gold halo, name in Playfair, "Member since…" sub, "New
game" gold button). A 4-up **stats grid** (Games played / Wins [gold] / Win rate [with a gold progress
bar] / Best streak). Then "Your board": a 2-column section (`360px 1fr`) — a large **active board
preview** card on the left (board in the active skin, name, tag, "Equipped" check) and an owned-skins
**selector grid** on the right.

**Skin selector:** each owned skin is a tile with a mini board + name; the active one has a gold border,
`--sh-glow`, and a gold check. Clicking a tile **equips it immediately** (updates the live preview and
persists). A trailing dashed "＋ {n} more skins in the shop" tile links to `/shop`.

> Pull name/avatar from Clerk's `user`. Stats from your backend. "Active skin" is per-user state.

---

## Interactions & Behavior (summary)
- **Navigation:** standard links between routes; gold "New game" everywhere creates a game and opens
  the board. Use TanStack Start routing; `:gameId` is the board's param.
- **Difficulty selection:** radio-group semantics, keyboard operable (Enter/Space), visible focus.
- **Board input model:** click your piece → its legal targets highlight → click a target to move.
  Clicking a piece with no legal move (because a capture is forced elsewhere) shakes it + shows a
  "Capture is mandatory" toast. Multi-jumps are presented as a single click on the final landing
  square and then animated hop-by-hop.
- **Motion:** pieces ease-out ~290ms; captures fade ~300ms; cards lift `translateY(-4px)` + `--sh-3`
  on hover; page transitions fade ~150ms; AI "thinking" pulses.
- **Responsive:** mobile-first down to 375px — board stays square and centered, side panel/columns
  stack, nav links collapse. Desktop is the primary review target.
- **A11y:** AA-contrast text on the dark surfaces, visible gold focus rings, `role="radiogroup"`/`radio`
  on selectors, `prefers-reduced-motion` disables animations (already handled in `ds.css`).

## State Management
Prototype keeps everything in **localStorage** via `assets/shared.js` (`Store`). Replace with your
real data layer; the shapes are a useful contract:
- **User:** `{ name, initials, signedIn }` → from **Clerk**.
- **Owned skins:** `string[]` of skin ids (always includes `emerald`). **Active skin:** one id.
- **Stats:** `{ played, wins, losses, draws }` (+ derived win rate, best streak).
- **Games:** keyed by id — `{ id, difficulty, status: 'in_progress'|'won'|'lost'|'draw', toMove:
  'human'|'ai', board (8×8), history[], moveCount, createdAt, updatedAt }`. The board cell is
  `null | { player:'human'|'ai', king:boolean }`.

## Game Engine (port directly)
`assets/engine.js` is **pure, framework-agnostic** and implements standard **English draughts**:
men move/capture one square diagonally forward, kings both directions (non-flying), **capture is
mandatory**, multi-jumps chain, promotion on reaching the far row (ends a jump chain). Human is at the
bottom (moves toward row 0), AI at the top.
Public API (`window.Damas`): `initialBoard()`, `legalMoves(board, player)`, `movesForSquare(board,r,c)`,
`applyMove(board, move)`, `countPieces(board)`, `winner(board, toMove)`, `aiMove(board, difficulty)`,
plus `evaluate`/`isClone`. A `move` is `{ from:[r,c], to:[r,c], captures:[[r,c]…], path:[[r,c]…] }`.
**AI:** Easy = random legal move; Medium = minimax depth 3; Hard = minimax depth 6 with alpha-beta.
> Recommend running `aiMove` (esp. Hard) in a **Web Worker** so the UI thread never blocks. The
> evaluation favors material (man 100, king 350) + advancement + edge safety.

## Assets
- **No raster assets.** All imagery is CSS/SVG generated:
  - Board + pieces are pure CSS (radial gradients + layered shadows), themed by CSS custom properties
    per skin (see `Store.SKINS` and `Store.applySkin`). Each skin sets
    `--sq-light --sq-dark --frame --edge --h1 --h2 --hk --a1 --a2 --ak`.
  - Brand glyph, robot mark, Google logo, medal chips, Stripe mark — all CSS/inline SVG of simple shapes.
  - King marker uses the unicode ♔ glyph.
- **Fonts:** Google Fonts — Playfair Display + Inter (swap to self-hosted in production).

## Files
- `index.html`, `play.html`, `leaderboard.html`, `shop.html`, `me.html` — vanilla HTML/CSS/JS pages.
- `game.html` — board page shell; mounts the React island.
- `assets/ds.css` — **design system**: tokens, typography, buttons, cards, badges, inputs, navbar, footer.
- `assets/board.css` — **board + pieces** styling (shared by game/landing/shop/profile previews).
- `assets/engine.js` — **checkers rules + AI** (pure functions; port directly).
- `assets/shared.js` — `Store`: localStorage state, the **6 skin definitions**, navbar markup, and the
  static-board renderer used for all previews. (Replace persistence; keep `SKINS` + theming.)
- `assets/game.jsx` — the interactive board **React** component (board, pieces, side panel, end modal,
  Tweaks). React 18 + Babel-standalone in the prototype; in your app this is just a normal component tree.
- `assets/tweaks-panel.jsx` — a prototype-only "Tweaks" panel (live board-skin / piece-finish /
  highlight-style / hints / coordinates switcher). **Not part of the product UI** — it was a design
  exploration tool. The values it toggles (active skin, assist preferences) are real product settings;
  surface them through Profile/Settings instead of this floating panel.

---
*Generated as a design reference. Recreate in React + TanStack Start + Tailwind + Clerk + Stripe using
your existing patterns; do not ship the HTML directly.*
