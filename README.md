# Damas PvE

> *Entrena tu mente. Vence a la máquina.*

A full-stack **English Checkers (Draughts 8×8)** game with an AI opponent, a cosmetic skin marketplace, and a public leaderboard — built as a TypeScript monorepo.

[![Bun](https://img.shields.io/badge/Bun-1.3+-black?logo=bun)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-API-E36002)](https://hono.dev)
[![TanStack](https://img.shields.io/badge/TanStack_Start-SSR-FF4154)](https://tanstack.com/start)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF)](https://clerk.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF)](https://stripe.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![Vitest](https://img.shields.io/badge/Vitest-Tests-6E9F18)](https://vitest.dev)

---

## Features

- **AI Opponent** — Minimax with alpha-beta pruning and iterative deepening; three difficulty levels (easy / medium / hard)
- **Complete Rules Engine** — Mandatory capture, multi-jump chains, crowning, and 40-ply draw detection
- **Cosmetic Marketplace** — 13 board skins (CSS themes + PNG clan bundles) purchasable via Stripe Checkout
- **Public Leaderboard** — Segmented by difficulty; ranked by fewest moves, then by fastest time
- **Auth & Sessions** — Clerk authentication with persistent game history per user
- **SSR Frontend** — TanStack Start with server-side rendering and Vite HMR

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser (port 3000)                 │
│             TanStack Start  ·  SSR + HMR             │
└──────────────┬──────────────────────────────────────┘
               │ REST / JSON
┌──────────────▼──────────────────────────────────────┐
│             Backend API (port 3001)                  │
│          Hono  ·  MongoDB  ·  Clerk auth             │
│  games · leaderboard · themes · stripe webhook       │
└──────────────┬──────────────────────────────────────┘
               │ internal HTTP (no DB access)
┌──────────────▼──────────────────────────────────────┐
│            AI Service (port 3002)                    │
│     Stateless Hono  ·  minimax + heuristic           │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology | Port |
|-------|-----------|:----:|
| Runtime | **Bun** 1.3+ | — |
| Backend API | **Hono** + MongoDB | 3001 |
| AI Service | **Hono** (stateless) | 3002 |
| Frontend | **TanStack Start** 1.99.x | 3000 |
| Auth | **Clerk** | — |
| Payments | **Stripe Checkout** | — |
| Tests | **Vitest** + Playwright | — |
| Infra | **Docker Compose** (4 services) | — |

---

## Game Rules

Standard **English Checkers** on an 8×8 board. Board orientation: row 0 = BLACK side, row 7 = RED side. The human always plays RED (advances toward row 0).

### Movement

| Piece | Move | Capture |
|-------|------|---------|
| Man (peon) | Diagonal forward, 1 square | Forward only |
| King (dama) | Diagonal any direction, 1 square | Any direction — non-flying |

### Core Rules

| Rule | Behaviour |
|------|-----------|
| **Mandatory capture** | If any capture is available, non-capture moves return `409 ILLEGAL_MOVE` |
| **Multi-jump chain** | After a capture the same piece must continue jumping until no more captures exist |
| **Crowning mid-chain** | A man that reaches the back rank during a chain is crowned immediately and the turn ends — it does not continue as a king |
| **Flying kings** | **Disabled** — kings move and capture exactly 1 diagonal square |
| **Backward capture (men)** | **Disabled** — men capture forward only |
| **Maximum capture** | **Not enforced** — any legal capture path is valid |
| **Draw** | After 40 half-moves (plies) without a capture or promotion (`status: "draw"`) |
| **Win / Loss** | A side with no legal moves on its turn loses immediately |

### Board Coordinates

- Only dark squares are used: `(row + col) % 2 === 1`
- Squares are addressed as `{ row: 0–7, col: 0–7 }`
- A move is a `path: Square[]` — two squares for a simple move, three or more for a capture chain

---

## Data Sources

All game state is persisted in **MongoDB** (`damas` database). The backend is the sole source of truth; the frontend never decides legality.

| Collection | What it stores |
|------------|---------------|
| `games` | Active and finished games — board state, turn, move history, status, timestamps |
| `users` | Clerk user ID → display name mapping |
| `themes` | Skin catalog — `_id` is a string slug (e.g. `"hada"`), `stripePriceId`, `priceUsdCents`, `kind`, `description` |
| `userSkins` | Purchase records — `{ clerkUserId, themeId, stripePaymentIntentId, purchasedAt }` |
| `leaderboard` | Win records — `{ clerkUserId, displayName, difficulty, movementsToWin, gameDurationMs, endedAt }` |

Leaderboard entries are created **only** for human victories (`status === "human_won"`). Draws and AI wins are not recorded.

Skin unlocks are created **only** via the Stripe webhook (`checkout.session.completed`). The success redirect URL is cosmetic only — no unlock happens on redirect.

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh) 1.3+
- [Clerk](https://clerk.com) account (development instance)
- [Stripe](https://stripe.com) account (test mode is fine)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (required for local webhook forwarding)

### 1 · Configure environment

```bash
cp .env.example .env
# Edit .env — fill in CLERK_*, STRIPE_*, and STRIPE_PRICE_* values
```

### 2 · Build and start

```bash
bun install --ignore-scripts        # workspace deps
docker compose build --no-cache     # builds all 4 services
docker compose up -d                # starts in background
```

### 3 · Seed the skin catalog

```bash
docker exec damas-backend bun run /app/backend/src/db/seed.ts
```

### 4 · Forward Stripe webhooks (required for purchases)

```bash
# In a separate terminal — keep this running while testing purchases
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy the `whsec_...` secret it prints and set it as `STRIPE_WEBHOOK_SECRET` in `.env`. Then rebuild the backend:

```bash
docker compose build backend && docker compose up -d backend
```

### 5 · Open the app

```
http://localhost:3000
```

### Local Development (without Docker)

```bash
cd backend    && bun run dev   # :3001
cd ai-service && bun run dev   # :3002
cd frontend   && bun run dev   # :3000
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `CLERK_SECRET_KEY` | Clerk backend secret (`sk_test_...`) |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from `stripe listen` (`whsec_...`) |
| `STRIPE_PRICE_*` | Stripe Price IDs for each skin (see `.env.example` for full list) |
| `AI_SERVICE_URL` | Internal AI service URL (`http://ai-service:3002` in Docker) |
| `FRONTEND_URL` | Frontend origin for Stripe redirects |

---

## API Reference

### Backend (`:3001`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/games` | ✓ | Create a new game |
| `GET` | `/api/games` | ✓ | List user's games |
| `GET` | `/api/games/:id` | ✓ | Get a game |
| `POST` | `/api/games/:id/moves` | ✓ | Submit a move |
| `GET` | `/api/games/:id/legal-moves` | ✓ | Get legal moves |
| `DELETE` | `/api/games/:id` | ✓ | Abandon a game |
| `GET` | `/api/leaderboard` | — | Public leaderboard (segmented by difficulty) |
| `GET` | `/api/themes` | — | Skin catalog |
| `POST` | `/api/themes/:id/purchase` | ✓ | Initiate Stripe Checkout |
| `POST` | `/api/stripe/webhook` | sig | Stripe webhook — unlocks skin on `checkout.session.completed` |
| `GET` | `/api/me` | ✓ | User profile + owned skins + active theme |
| `PUT` | `/api/me/active-theme` | ✓ | Set active skin (must own it) |

### AI Service (`:3002`, internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/ai/move` | Compute best move for a given board state |
| `GET` | `/health` | Liveness check |

### Error Codes

| Code | Status | When |
|------|:------:|------|
| `ILLEGAL_MOVE` | 409 | Non-capture move when captures exist, or invalid path |
| `GAME_OVER` | 409 | Move attempted on a finished game |
| `SKIN_NOT_OWNED` | 403 | Active-theme set to an unpurchased skin |
| `AI_SERVICE_ERROR` | 502 | AI service unreachable or timed out |
| `UNAUTHORIZED` | 401 | Missing or invalid Clerk JWT |

---

## Tests

```bash
# Rules engine — 19 tests (CA-01..CA-07)
cd backend    && bun test tests/rules.test.ts

# AI service — 6 tests (stateless check + <2s p95 on hard)
cd ai-service && bun test

# Frontend components (React Testing Library)
bun run --cwd frontend test

# Coverage report (target ≥ 80%)
cd backend    && bun run test:coverage
cd ai-service && bun run test:coverage

# E2E HTTP audit — 16 checks, no browser required
bun run e2e/http-audit.ts

# Playwright E2E (requires system deps)
sudo apt-get install -y libasound2   # first time only
npx playwright test
```

---

## Project Structure

```
damas/
├── backend/src/
│   ├── rules/          # Move generator, validator, game-end detection
│   ├── routes/         # games, leaderboard, themes, me
│   ├── stripe/         # Checkout session + webhook (async HMAC under Bun)
│   └── db/             # MongoDB client + seed script
├── ai-service/src/
│   ├── minimax.ts      # Alpha-beta pruning + iterative deepening
│   ├── heuristic.ts    # 5-component board evaluation
│   └── moveGen.ts      # Stateless copy of the rules engine
├── frontend/src/
│   ├── components/     # Board, Piece, Leaderboard, StaticBoard
│   └── routes/         # index, play, play.$gameId, leaderboard, shop, me
├── packages/
│   └── shared/src/types.ts   # Single source of truth for all shared TS types
├── prd.md              # Product requirements (authoritative spec)
├── CLAUDE.md           # AI collaboration guide and architectural decisions
└── docker-compose.yml
```

---

## Known Limitations

| Area | Limitation |
|------|-----------|
| **Skin assets** | PNG clan skins (`templo`, `desierto`, `bosque`, `hada`, `fuego`, `agua`, `sombra`) use placeholder images. Final art is pending. |
| **Stripe webhooks in dev** | Skin purchases require `stripe listen` running locally. Without it, the webhook never fires and the skin is not granted — the Stripe success redirect is cosmetic only. |
| **`STRIPE_PRICE_VECTOR` / `STRIPE_PRICE_PIXEL`** | Two CSS skins (`vector` and `pixel`) have placeholder Price IDs. They redirect to Stripe but will fail at checkout until real Price IDs are created in the Stripe dashboard. |
| **Flying kings / maximum capture** | Disabled by design (MVP ruleset). Configurable via `RulesConfig` but not exposed in the UI. |
| **Hot reload in Docker (WSL2)** | Frontend volume mounts are disabled on WSL2 drives. Any change to `frontend/src/` or `packages/shared/` requires a container rebuild: `docker compose build frontend && docker compose up -d frontend`. |
| **HMR WebSocket** | WS connection to port 24678 fails in Docker because two Vinxi dev servers share the HMR config. Impact: zero — hot reload is unavailable in Docker anyway. The four resulting console errors are noise, not bugs. |
| **Leaderboard ties** | When two entries share identical `movementsToWin` and `gameDurationMs`, their relative order is non-deterministic (MongoDB insertion order). |
| **Single-player only** | No PvP mode. Human always plays RED; AI always plays BLACK. |
| **Post-game analysis** | Move history is persisted but no analysis UI exists (deferred to v2). |

---

## License

[MIT](LICENSE)
