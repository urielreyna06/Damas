# CLAUDE.md — Damas PvE

> Fuente de verdad operacional para cualquier agente LLM que retome este proyecto.
> Leer este archivo COMPLETO antes de tocar código. Para ambigüedades no cubiertas aquí → leer `prd.md`.

> **Al retomar el proyecto:** leer también `HANDOFF_PROMPT.md` (estado actual + tareas pendientes)
> y `SESSION_LOG.md` (diario cronológico de cambios y bugs resueltos por sesión).
> **Para estudiar/entender el proyecto a fondo** (arquitectura, por qué cada herramienta,
> conceptos, bugs y casos borde, nivel intro + técnico): `GUIA_DIDACTICA.md`.
> **Ubicación actual:** `/mnt/a/Claude/Projects/Damas/` (WSL) = `A:\Claude\Projects\Damas\` (Windows).

---

## 1. Qué es este proyecto

Juego de Damas (Checkers 8×8) PvE contra una IA con tres dificultades (easy/medium/hard).
Monetización: marketplace de skins cosméticas vía Stripe Checkout (single-seller).
Ranking público segmentado por dificultad, desempate por eficiencia (movimientos) y tiempo.

**PRD definitivo:** `prd.md` (v2.2) — todas las decisiones de diseño están ahí cerradas.

---

## 2. Stack (no negociable)

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Runtime | **Bun** | — |
| Backend API | **Hono** + MongoDB | 3001 |
| AI Service | **Hono** (stateless) | 3002 |
| Frontend | **TanStack Start** | 3000 |
| Auth | **Clerk** | — |
| Pagos | **Stripe Checkout** modo `payment` | — |
| Tests | **Vitest** + React Testing Library | — |
| Infra | **Docker Compose** (4 servicios) | — |

---

## 3. Estructura de archivos

```
damas-pve/
├── prd.md                          ← spec absoluta (leer antes que nada)
├── CLAUDE.md                       ← este archivo
├── docker-compose.yml
├── .env.example                    ← todas las env vars documentadas
├── package.json                    ← workspace root (workspaces: shared/backend/ai-service/frontend)
├── scripts/
│   └── install-hooks.sh            ← instala git hooks pre-commit/pre-push
├── packages/
│   └── shared/src/types.ts         ← ÚNICA fuente de tipos TS (Board, Game, Move, etc.)
├── backend/
│   ├── src/
│   │   ├── index.ts                ← entry point Hono, monta todas las rutas
│   │   ├── db/
│   │   │   ├── index.ts            ← connectDb(), col.games/users/themes/userSkins/leaderboard
│   │   │   └── seed.ts             ← inserta 3 skins placeholder (bun run seed)
│   │   ├── clerk/middleware.ts     ← requireAuth, getClerkUser(c) → {clerkUserId, displayName}
│   │   ├── rules/
│   │   │   ├── moveGenerator.ts    ← generateLegalMoves, applyMove, initialBoard, RulesConfig
│   │   │   ├── moveValidator.ts    ← validateMove(board, path, side, rules)
│   │   │   └── gameEnd.ts          ← detectGameEnd(board, turn, plySinceProgress, rules)
│   │   ├── routes/
│   │   │   ├── games.ts            ← CRUD partidas + orquestación turno humano→IA
│   │   │   ├── leaderboard.ts      ← GET público, segmentado por difficulty
│   │   │   ├── themes.ts           ← catálogo + POST /:id/purchase → Stripe Checkout
│   │   │   └── me.ts               ← perfil + skins compradas + cambio de skin activa
│   │   └── stripe/
│   │       ├── checkout.ts         ← createCheckoutSession()
│   │       └── webhook.ts          ← verifica firma Stripe → crea UserSkin (upsert)
│   ├── tests/rules.test.ts         ← 19 tests Vitest (CA-01..CA-07)
│   └── vitest.config.ts            ← coverage ≥80% en src/rules y src/stripe
├── ai-service/
│   ├── src/
│   │   ├── index.ts                ← entry point, GET /health
│   │   ├── routes.ts               ← POST /internal/ai/move
│   │   ├── minimax.ts              ← findBestMove() — alfa-beta + iterative deepening
│   │   ├── heuristic.ts            ← evaluate(board, side) — 5 componentes del PRD §6.7
│   │   └── moveGen.ts              ← copia local de generateLegalMoves + applyMove (stateless)
│   ├── tests/ai.test.ts            ← CA-09 (stateless), CA-10 (< 2s p95)
│   └── vitest.config.ts
└── frontend/
    ├── app.config.ts               ← TanStack Start config
    ├── src/
    │   ├── router.tsx / client.tsx / ssr.tsx
    │   ├── lib/api.ts              ← todas las funciones de API tipadas
    │   ├── components/
    │   │   ├── Board.tsx           ← tablero interactivo 8×8, lógica de selección/path
    │   │   ├── Piece.tsx           ← renderiza man/king con tema activo
    │   │   └── Leaderboard.tsx     ← tabla rank/nombre/movimientos/tiempo/fecha
    │   └── routes/
    │       ├── __root.tsx          ← ClerkProvider + nav
    │       ├── index.tsx           ← landing, botones easy/medium/hard
    │       ├── play.tsx            ← lista partidas + nueva partida
    │       ├── play.$gameId.tsx    ← partida activa con Board
    │       ├── leaderboard.tsx     ← tabs por dificultad
    │       ├── shop.tsx            ← catálogo de skins
    │       └── me.tsx              ← perfil + selector de skin activa
    ├── tests/
    │   ├── Board.test.tsx          ← 5 tests RTL
    │   └── setup.ts
    └── vitest.config.ts
```

---

## 4. Reglas de oro (nunca romper)

1. **El backend es el ÚNICO árbitro de reglas.** El frontend nunca decide legalidad.
2. **El AI Service NUNCA accede a MongoDB** ni guarda estado. Es stateless puro.
3. **Desbloqueos de skin** SOLO vía webhook Stripe con firma verificada (`STRIPE_WEBHOOK_SECRET`).
4. **`startedAt` y `endedAt`** son fijados server-side (`new Date().toISOString()`). Ignorar cualquier timestamp del cliente.
5. **TypeScript estricto** en todos los servicios. Sin `any` implícito. Tipos compartidos en `packages/shared/src/types.ts`.
6. **Leaderboard solo victorias humanas** (`status === "human_won"`). Empates/derrotas no generan `LeaderboardEntry`.

---

## 5. Reglas del juego (Damas inglesas 8×8)

MVP usa estas reglas fijas (`MVP_RULES` en `backend/src/routes/games.ts`):
```typescript
{ menCaptureBackward: false, flyingKings: false, forceMaximumCapture: false }
```

- `row 0` = lado BLACK, `row 7` = lado RED. **Humano siempre es RED.**
- Casillas oscuras: `(row + col) % 2 === 1`
- RED avanza hacia `row` decreciente (hacia 0), BLACK hacia `row` creciente (hacia 7)
- Peón captura SOLO hacia adelante. Dama captura en cualquier diagonal (1 casilla, no voladora)
- **Captura obligatoria:** si hay capturas disponibles, los movimientos no-captura devuelven `409 ILLEGAL_MOVE`
- **Cadena de captura:** continúa con la misma ficha hasta agotar capturas
- **Coronación durante cadena:** corona y termina el turno (no continúa como Dama)
- **Tablas:** `plySinceProgress >= 40` (reset en cada captura o coronación)

---

## 6. Contratos de API

### Backend (puerto 3001)
```
POST   /api/games                    Clerk  → crea partida {difficulty}
GET    /api/games                    Clerk  → lista partidas del usuario
GET    /api/games/:id                Clerk  → obtiene partida
POST   /api/games/:id/moves          Clerk  → {path: Square[]} → {game, lastAiMove?}
GET    /api/games/:id/legal-moves    Clerk  → Move[]
DELETE /api/games/:id                Clerk  → abandona partida

GET    /api/leaderboard?difficulty=X&limit=N  público → LeaderboardEntry[]
GET    /api/themes                            público → Theme[]
POST   /api/themes/:id/purchase      Clerk  → {checkoutUrl}
POST   /api/stripe/webhook           firma Stripe → 200 {received:true}
GET    /api/me                       Clerk  → {user, skins, activeTheme}
PUT    /api/me/active-theme          Clerk  → {themeId} → 200 | 403 SKIN_NOT_OWNED
```

### Códigos de error relevantes
| Code | Status | Cuándo |
|------|--------|--------|
| `ILLEGAL_MOVE` | 409 | Movimiento inválido o no-captura cuando hay capturas |
| `SKIN_NOT_OWNED` | 403 | Intentar activar skin no comprada |
| `GAME_OVER` | 409 | Mover en partida ya terminada |
| `AI_SERVICE_ERROR` | 502 | AI Service no responde |
| `UNAUTHORIZED` | 401 | JWT Clerk inválido o ausente |

### AI Service (puerto 3002, interno)
```
POST /internal/ai/move   AiMoveRequest → AiMoveResponse
GET  /health             → {ok: true}
```

---

## 7. MongoDB — colecciones e índices

Colecciones: `games`, `users`, `themes`, `userSkins`, `leaderboard`

Acceso: siempre vía `col.*()` de `backend/src/db/index.ts` (nunca instanciar `MongoClient` directamente en rutas).

Índices ya creados en `connectDb()`:
- `games`: `{clerkUserId,status}` + `{clerkUserId,updatedAt:-1}`
- `userSkins`: `{clerkUserId,themeId}` unique
- `leaderboard`: `{difficulty,movementsToWin,gameDurationMs,endedAt}`

---

## 8. Variables de entorno necesarias

Copiar `.env.example` → `.env` y rellenar:

```bash
MONGODB_URI=mongodb://admin:secret@localhost:27017/damas?authSource=admin
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...       # desde Stripe CLI: stripe listen --forward-to localhost:3001/api/stripe/webhook
AI_SERVICE_URL=http://localhost:3002  # http://ai-service:3002 en Docker
FRONTEND_URL=http://localhost:3000
```

Para las skins placeholder (seed), añadir Price IDs de Stripe:
```bash
STRIPE_PRICE_CLASSIC_WOOD=price_...
STRIPE_PRICE_NEON_GLOW=price_...
STRIPE_PRICE_MARBLE_BOARD=price_...
```

---

## 9. Cómo arrancar localmente

```bash
# ── Primera vez (build completo) ─────────────────────────────────────
bun install --ignore-scripts          # workspace root
docker compose build --no-cache       # build limpio (los 3 servicios)
docker compose up -d                  # arranca todo en background
docker exec damas-backend bun run /app/backend/src/db/seed.ts  # seed skins

# ── Arranque normal (ya construido) ──────────────────────────────────
docker compose up -d

# ── Verificar servicios ───────────────────────────────────────────────
docker compose ps
docker logs damas-frontend --tail=20  # buscar "Local: http://localhost:3000/"
docker logs damas-backend  --tail=10
docker logs damas-ai-service --tail=10

# ── Desarrollo: cambios en código fuente ─────────────────────────────
# El docker-compose.yml tiene volumes montados para frontend/src, frontend/public
# y packages/shared. Los cambios se reflejan SIN rebuild, PERO:
#   · Cambios en componentes React (client-side) → HMR automático (sin acción)
#   · Cambios en rutas SSR (__root.tsx, layouts) → requieren restart:
docker compose restart frontend

# ── Backend / AI Service: cambios en código ──────────────────────────
# NO tienen volumes — requieren rebuild del contenedor afectado:
docker compose build backend && docker compose up -d backend
docker compose build ai-service && docker compose up -d ai-service

# ── Desarrollo local sin Docker (más rápido para iterar) ─────────────
cd backend    && bun run dev   # puerto 3001
cd ai-service && bun run dev   # puerto 3002
cd frontend   && bun run dev   # puerto 3000
```

**Nota sobre el frontend:** el primer `bun run dev` genera `src/routeTree.gen.ts` automáticamente.

**Lecciones críticas (ver `SESSION_LOG.md` para detalle completo):**
- El seed DEBE correr dentro del contenedor (`docker exec`), no desde WSL.
- `bun install --ignore-scripts` es obligatorio (evita el hook `prepare` sin repo git).
- Bun 1.3+ genera `bun.lock` (texto). Los Dockerfiles usan `bun.lock*`.
- El stack TanStack Start está fijado a **1.99.x** vía `overrides` en `package.json` raíz.
  **NO cambiar esas versiones sin leer SESSION_LOG.md** — costó mucho estabilizarlas.
- `app.config.ts` usa `tsr: { appDirectory: "src" }` porque las rutas viven en `src/`.
- El frontend en Docker usa `vinxi dev --host --port 3000` (`--host` es necesario).
- **`_id` de themes DEBE ser slug string (CRÍTICO):** `seed.ts` usa `_id: "classic_wood"` etc.
  `THEME_ID_TO_SKIN` en `skins.ts` mapea por slug. Si el seed usa ObjectIds (sin `_id` explícito),
  `resolveSkin(theme._id)` nunca matchea → todas las skins muestran "Emerald Classic" en shop
  y /me. El seed hace drop+recreate de `themes` y `userSkins` para evitar documentos legacy.
  **NO cambiar el seed a `updateOne($set)` sin `_id` explícito.**
- **Volume mounts en WSL2 con drive `/mnt/a/` (CRÍTICO):** Docker Desktop no puede montar
  paths de drives secundarios (`/mnt/a/`, `/mnt/d/`, etc.) en WSL2. El bind mount se aplica
  pero queda vacío, sobreescribiendo los archivos del build con un directorio vacío → 503 +
  `ENOENT scandir /app/frontend/src/routes`. **El frontend NO usa volume mounts.** Cualquier
  cambio en `frontend/src` o `packages/shared` requiere rebuild:
  `docker compose build frontend && docker compose up -d frontend`.
- **CSS en dev mode:** `<Scripts/>` de TanStack Start requiere build manifest (solo prod).
  El frontend usa un `<script dangerouslySetInnerHTML>` en `<body>` que llama a
  `import("/_build/src/client.tsx")` para arrancar Vite HMR y cargar los CSS.
  En producción (`vinxi build`) esto se reemplazaría por el manifest de assets.
- **React 18.3 Float:** suprime `<script src>` y `<script type="module" dangerouslySetInnerHTML>`
  en SSR cuando el root component renderiza `<html>/<head>/<body>`. Solo `<script dangerouslySetInnerHTML>`
  SIN `type="module"` escapa la supresión.
- **React preamble en dev mode:** `@vitejs/plugin-react` lanza `can't detect preamble` porque los
  módulos ES ejecutan depth-first: `__root.tsx` (hoja) corre ANTES que `client.tsx` (raíz), donde el
  plugin normalmente inyectaría el preamble. Fix: el bootstrap script en `__root.tsx` importa
  `/@react-refresh` y fija `window.__vite_plugin_react_preamble_installed__=true` ANTES de hacer el
  `import("/_build/src/client.tsx")`. **NO revertir este orden.**
- **HMR WebSocket en Docker:** Vinxi asigna el WebSocket HMR a un puerto aleatorio que Docker no expone.
  Se fijó a 24678 en `app.config.ts` (`server.hmr.port` + `clientPort`) y se expone en `docker-compose.yml`.
  Cambios a `app.config.ts` requieren rebuild: `docker compose build frontend && docker compose up -d frontend`.
- **HMR WebSocket 400 — ruido de consola ESPERADO (no es bug):** En el browser aparecen 4 errores:
  `ws://localhost:24678/_build/?token=... → 400`, `[vite] failed to connect to websocket`,
  `WebSocket closed without opened`, y un `404` de `/@react-refresh`. Causa raíz: Vinxi levanta
  DOS dev servers (client + SSR) que comparten la config `server.hmr`; el segundo no consigue el
  puerto → log del servidor `WebSocket server error: Port undefined is already in use` → el browser
  conecta al WS equivocado → 400. **Impacto NULO:** solo afecta hot-reload en vivo, que este
  frontend NO usa (sin volume mounts en WSL2 → cada cambio requiere rebuild). NO intentar
  "arreglarlo" tocando `server.hmr` sin necesidad real — arriesga desestabilizar el stack
  TanStack 1.99.x. Junto con `<Scripts/> found no manifest`, `__clerk_init_state=undefined` y
  `loaderData:{"$undefined":0}`, son todos warnings de dev mode inofensivos.
- **`optimizeDeps.include` en `app.config.ts` (DX):** Sin pre-bundle explícito, Vite descubre las
  deps críticas (react, react-dom, @tanstack/*, @clerk/tanstack-start) de forma lazy en la PRIMERA
  visita del browser → emite `optimized dependencies changed. reloading` → full-page reload que
  parpadea y reinicia Clerk. El bloque `optimizeDeps.include` las pre-bundlea al arrancar el
  container, eliminando ese reload. NO elimina el WS 400 (causa distinta, ver arriba).
- **Hot reload SSR en WSL volumes:** inotify en WSL2 es inestable para Vinxi SSR.
  Si un cambio en `__root.tsx` u otras rutas SSR no se refleja, hacer `docker compose restart frontend`.
- **Hidratación del cliente (CRÍTICO):** `frontend/src/client.tsx` DEBE llamar
  `hydrateRoot(document, <StartClient router={router}/>)`. Si solo exporta un componente sin montar,
  el SSR se renderiza pero queda inerte: React nunca toma control → Clerk no inicializa →
  el botón de login no es clickeable y el CSS no se procesa. NO revertir a `export default`.
  Verificable con `bun run e2e/verify-login.mjs` (requiere `sudo npx playwright install-deps chromium`).
- **Webhook Stripe bajo Bun (CRÍTICO):** `backend/src/stripe/webhook.ts` DEBE usar
  `await constructEventAsync(...)`, NO `constructEvent` (sync). El `SubtleCryptoProvider` de Stripe
  bajo Bun solo computa HMAC async; el sync lanza excepción → toda firma válida cae como
  `400 INVALID_SIGNATURE` y los desbloqueos de skin (CA-17) se pierden en silencio.
- **`getToken` de Clerk NUNCA en deps de useCallback/useEffect (CRÍTICO):** La función
  `getToken` de `useAuth()` puede cambiar de referencia entre renders (especialmente durante
  inicialización y token-refresh de Clerk). Incluirla en `[…, getToken]` recrea el callback
  en cada render → el `useEffect` dependiente refirma → múltiples fetches concurrentes y
  race conditions → puede causar `loading=true` infinito. Patrón correcto: llamar `await getToken()`
  *dentro* del callback al momento de invocar (no capturarla). Añadir comentario
  `// eslint-disable-next-line react-hooks/exhaustive-deps` para silenciar el linter.
- **`<Outlet/>` en rutas padre con hijos (CRÍTICO — bug "no puedo entrar a la partida"):**
  `/play/$gameId` es ruta HIJA de `/play` en el enrutado file-based de TanStack
  (`play.$gameId.tsx` se anida bajo `play.tsx`; ver `routeTree.gen.ts`:
  `PlayGameIdRoute.getParentRoute = () => PlayRoute`). Para que un hijo se monte, el componente
  padre DEBE renderizar `<Outlet/>`. `play.tsx` renderiza el lobby, así que cede al hijo con
  `const childMatches = useChildMatches(); if (childMatches.length > 0) return <Outlet />;`
  (tablero cuando hay hijo activo, lobby solo en `/play` exacto). **Si se quita ese `<Outlet/>`,
  al pulsar "Continuar" la URL cambia a `/play/:id` pero el tablero NUNCA monta** (no se dispara
  `GET /api/games/:id`) → se percibe como carga infinita. NO confundir con bugs de Clerk/loading.
  Verificable: el golden path de acceso solo se prueba en browser CON sesión real
  (`e2e/golden-cookies.mjs` inyecta cookies de Clerk; `verify-login.mjs` solo toca la landing).

---

## 10. Tests

```bash
# ── Unitarios / integración (sin Docker) ─────────────────────────────
cd backend    && bun test tests/rules.test.ts   # 19 pass — CA-01..CA-07
cd ai-service && bun test                       # 6 pass  — CA-09, CA-10

# ── Con Docker (requiere MongoDB para integración) ────────────────────
docker exec damas-backend bun test              # rules (19) + integración
docker exec damas-ai-service bun test           # CA-09, CA-10 (6 pass)
bun run --cwd frontend test                     # unit tests RTL (desde WSL)

# ── Con cobertura (objetivo ≥80%) ────────────────────────────────────
cd backend    && bun run test:coverage
cd ai-service && bun run test:coverage

# ── Auditoría E2E HTTP (no requiere browser, corre contra Docker) ─────
cd /mnt/a/Claude/Projects/Damas && bun run e2e/http-audit.ts
# 16 checks: rutas, SSR HTML, favicon, CSS delivery, APIs, leaderboard

# ── E2E con Playwright (requiere dep del sistema en WSL) ──────────────
sudo apt-get install -y libasound2   # solo la primera vez
cd /mnt/a/Claude/Projects/Damas && npx playwright test
# Tests en e2e/audit.spec.ts — corre contra http://localhost:3000

# ── INV-02: calibración heurística (~15-20 min) ──────────────────────
cd ai-service && bun run src/calibrate.ts
# DEFAULT_WEIGHTS validados near-optimal — no actualizar salvo mejora >55%
```

---

## 11. Criterios de aceptación del MVP

| ID | Descripción | Módulo |
|----|-------------|--------|
| CA-01 | Captura obligatoria bloquea no-capturas → `409 ILLEGAL_MOVE` | rules |
| CA-02 | Cadena de captura devuelve path completo | rules |
| CA-03 | Peón no captura hacia atrás | rules |
| CA-04 | Coronación durante cadena termina turno | rules |
| CA-05 | Dama no voladora (1 casilla diagonal) | rules |
| CA-06 | Tablas a los 40 plies sin progreso | rules |
| CA-07 | Bando sin movimientos legales pierde | rules |
| CA-08 | Backend ignora board del cliente (usa DB) | backend |
| CA-09 | AI Service sin acceso a MongoDB | ai-service |
| CA-10 | AI `hard` responde < 2s p95 | ai-service |
| CA-11 | Backend ignora `startedAt`/`endedAt` del cliente | backend |
| CA-12..15 | Leaderboard: registro, segmentación, desempate, empates no cuentan | backend |
| CA-16 | Leaderboard lectura pública (sin auth) | backend |
| CA-17 | Webhook Stripe crea `UserSkin` persistente | backend |
| CA-18 | `PUT /api/me/active-theme` → `403` si no comprada | backend |
| CA-19..20 | Skin persistente entre sesiones; no afecta mecánica | backend |
| CA-21..22 | Auth obligatoria para jugar; no hay partidas anónimas | backend |

---

## 12. Investigaciones paralelas pendientes (no bloqueantes)

| ID | Tarea | Notas |
|----|-------|-------|
| INV-01 | Assets reales para skins | OpenGameArt, Itch.io. 5 skins placeholder activas. Mantener convención `{color}-{kind}.svg` en `frontend/public/themes/{skin_id}/` |
| INV-02 | Calibrar pesos heurísticos (**✅ CERRADO**) | Ejecutado hill-climbing 40 iter×2 rondas. DEFAULT_WEIGHTS validados near-optimal: ninguna perturbación [×2,×0.5,×1.5,×0.67] los supera. No actualizar. |
| INV-03 | UX leaderboard segmentado (**resuelto**) | `frontend/src/routes/leaderboard.tsx` usa tabs Fácil/Medio/Difícil |

---

## 13. Lo que falta para producción (post-MVP)

- `routeTree.gen.ts` generado por primer `vinxi dev` (no está en repo, se genera en build)
- ~~Price IDs reales de Stripe~~ — configurados en `.env` (test mode, 2026-06-02)
- Assets SVG/PNG reales para las 3 skins placeholder
- Configurar Stripe webhook endpoint en el Stripe dashboard apuntando a tu dominio
- Variables de entorno de producción para Clerk (production instance)
- Análisis post-partida (RF-37, diferido a v2 — historial de movimientos ya se persiste)
