# ♟ Damas PvE

> *Train your mind. Defeat the machine.*

A full-stack **English Checkers (Draughts 8×8)** game with AI opponents, a cosmetic skin marketplace, and a public leaderboard — built on a modern TypeScript monorepo.

[![Bun](https://img.shields.io/badge/Bun-1.3+-black?logo=bun)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono)](https://hono.dev)
[![TanStack](https://img.shields.io/badge/TanStack_Start-SSR-FF4154)](https://tanstack.com/start)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk)](https://clerk.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## Features

- **AI Opponent** — Minimax with alpha-beta pruning and iterative deepening at three difficulty levels
- **Complete Rules Engine** — Mandatory capture, multi-jump chains, crowning, and draw detection
- **Cosmetic Marketplace** — 13 board skins (CSS themes + PNG clan bundles) purchasable via Stripe Checkout
- **Public Leaderboard** — Segmented by difficulty; ranked by moves to win then game duration
- **Auth & Sessions** — Clerk authentication with persistent game history
- **SSR Frontend** — TanStack Start with server-side rendering

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (port 3000)                │
│              TanStack Start (SSR + HMR)              │
└──────────────┬──────────────────────────────────────┘
               │ REST
┌──────────────▼──────────────────────────────────────┐
│              Backend API (port 3001)                 │
│           Hono + MongoDB + Clerk auth                │
│   games · leaderboard · themes · stripe webhook      │
└──────────────┬──────────────────────────────────────┘
               │ internal HTTP
┌──────────────▼──────────────────────────────────────┐
│             AI Service (port 3002)                   │
│     Stateless Hono — minimax, never touches DB       │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology | Port |
|-------|-----------|:----:|
| Runtime | **Bun** | — |
| Backend API | **Hono** + MongoDB | 3001 |
| AI Service | **Hono** (stateless) | 3002 |
| Frontend | **TanStack Start** | 3000 |
| Auth | **Clerk** | — |
| Payments | **Stripe Checkout** | — |
| Tests | **Vitest** | — |
| Infra | **Docker Compose** | — |

---

## Game Rules

Standard English Checkers on an 8×8 board:

- Men move and capture **forward only** · Kings capture any diagonal (non-flying, 1 square)
- **Mandatory capture** — if captures are available, non-capture moves return `409 ILLEGAL_MOVE`
- **Multi-jump chains** — continue with the same piece until all captures are exhausted
- Crowning during a chain **ends the turn**
- Draw at **40 plies** without a capture or promotion

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Bun](https://bun.sh) 1.3+
- [Clerk](https://clerk.com) account
- [Stripe](https://stripe.com) account (test mode is fine)

### Setup

```bash
# 1. Clone
git clone https://github.com/urielreyna06/Damas.git
cd Damas

# 2. Install (--ignore-scripts avoids the prepare hook without a git repo context)
bun install --ignore-scripts

# 3. Configure environment
cp .env.example .env
# Edit .env with your Clerk, Stripe, and MongoDB credentials

# 4. Build and start all services
docker compose build --no-cache
docker compose up -d

# 5. Seed the skin catalog
docker exec damas-backend bun run /app/backend/src/db/seed.ts

# 6. Open the app
open http://localhost:3000
```

### Local Development (without Docker)

```bash
# Terminal 1
cd backend    && bun run dev   # http://localhost:3001

# Terminal 2
cd ai-service && bun run dev   # http://localhost:3002

# Terminal 3
cd frontend   && bun run dev   # http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `CLERK_SECRET_KEY` | Clerk backend secret (`sk_test_...`) |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend key (`pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `AI_SERVICE_URL` | Internal AI service URL |
| `FRONTEND_URL` | Frontend origin (for Stripe redirect) |

For Stripe webhook forwarding during local development:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

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
| `GET` | `/api/leaderboard` | — | Public leaderboard |
| `GET` | `/api/themes` | — | Skin catalog |
| `POST` | `/api/themes/:id/purchase` | ✓ | Create Stripe checkout |
| `POST` | `/api/stripe/webhook` | sig | Stripe webhook |
| `GET` | `/api/me` | ✓ | User profile + skins |
| `PUT` | `/api/me/active-theme` | ✓ | Set active skin |

### AI Service (`:3002`, internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/ai/move` | Compute best move |
| `GET` | `/health` | Health check |

---

## Tests

```bash
# Rules engine (19 tests — CA-01..CA-07)
cd backend    && bun test tests/rules.test.ts

# AI service (6 tests — stateless + <2s p95)
cd ai-service && bun test

# Frontend components (React Testing Library)
bun run --cwd frontend test

# E2E HTTP audit (requires running stack)
bun run e2e/http-audit.ts

# Playwright E2E
npx playwright test
```

---

## Project Structure

```
damas/
├── backend/
│   └── src/
│       ├── rules/          # Move generator, validator, game-end detection
│       ├── routes/         # games, leaderboard, themes, me
│       ├── stripe/         # Checkout + webhook (async HMAC under Bun)
│       └── db/             # MongoDB client + seed
├── ai-service/
│   └── src/
│       ├── minimax.ts      # Alpha-beta + iterative deepening
│       ├── heuristic.ts    # 5-component board evaluation
│       └── moveGen.ts      # Stateless copy of rules engine
├── frontend/
│   └── src/
│       ├── components/     # Board, Piece, Leaderboard
│       └── routes/         # index, play, leaderboard, shop, me
├── packages/
│   └── shared/src/types.ts # Single source of truth for all TS types
├── prd.md                  # Product requirements (source of truth)
├── CLAUDE.md               # AI collaboration guide
└── docker-compose.yml
```

---

## License

[MIT](LICENSE)
