# PROJECT_BREAKDOWN.md — Damas PvE

> Análisis exhaustivo del proyecto, de lo básico a lo avanzado, para un desarrollador
> que se une al equipo. Basado en el código fuente real, `prd.md` (v2.2), `CLAUDE.md`
> y `SESSION_LOG.md`. Lo que no está confirmado por el código se marca **PENDIENTE DE ACLARAR**.
>
> Última actualización: 2026-06-03.

---

## 1. Visión general del proyecto

**Damas PvE** es un juego de Damas inglesas (Checkers 8×8) jugador-contra-IA, con monetización
vía un marketplace de skins cosméticas y un ranking público competitivo.

### Propósito y objetivos
- Ofrecer una experiencia de damas pulida contra una IA de tres dificultades (easy/medium/hard).
- Monetizar mediante skins cosméticas (Stripe Checkout, single-seller) **sin afectar la mecánica**.
- Fomentar la competición con un leaderboard público segmentado por dificultad.

### Funcionalidades clave
| Funcionalidad | Descripción |
|---------------|-------------|
| **Autenticación** | Login/registro con Clerk (modal). Obligatoria para jugar. |
| **Gameplay PvE** | Partidas contra IA minimax. El backend es el único árbitro de reglas. |
| **Leaderboard** | Público, segmentado por dificultad. Solo registra victorias humanas. |
| **Tienda de skins** | Catálogo de skins → Stripe Checkout → desbloqueo vía webhook. |
| **Perfil** | Skins compradas + selector de skin activa. |

### Usuarios objetivo
Jugadores casuales y competitivos de damas que buscan retar a una IA y, opcionalmente,
personalizar el tablero. Monetización dirigida a quienes quieren cosméticos.

---

## 2. Arquitectura de alto nivel

Monorepo Bun con 4 workspaces, orquestados por Docker Compose. Tres servicios HTTP + MongoDB.

```mermaid
flowchart TB
    subgraph Cliente
        B[Browser]
    end
    subgraph Frontend["Frontend :3000 — TanStack Start + vinxi (SSR)"]
        FE[Rutas / Componentes React]
    end
    subgraph Backend["Backend :3001 — Hono"]
        API[Rutas API]
        RULES[Motor de reglas\nmoveGenerator / validator / gameEnd]
    end
    subgraph AI["AI Service :3002 — Hono (stateless)"]
        MM[minimax + heuristica]
    end
    DB[(MongoDB :27017)]
    CLERK[[Clerk — Auth externa]]
    STRIPE[[Stripe — Pagos externos]]

    B <-->|HTTP/SSR| FE
    B <-->|Clerk JS SDK| CLERK
    FE -->|fetch tipado + JWT Clerk| API
    API -->|verifyToken| CLERK
    API <--> DB
    API -->|POST /internal/ai/move| MM
    API -->|Checkout Session| STRIPE
    STRIPE -->|webhook firmado| API
    B -->|redirect Checkout| STRIPE
```

### Flujo de datos principal (un turno de juego)
1. El humano selecciona un movimiento en `Board.tsx` → `POST /api/games/:id/moves` con el `path`.
2. El backend carga la partida desde MongoDB (**ignora cualquier board del cliente**), valida la
   legalidad con el motor de reglas, aplica el movimiento.
3. Si la partida sigue, el backend llama al AI Service (`POST /internal/ai/move`) con el board actual.
4. El AI Service (stateless) calcula el mejor movimiento con minimax y lo devuelve.
5. El backend aplica el movimiento de la IA, persiste el nuevo estado y responde `{game, lastAiMove}`.
6. Si la partida termina en victoria humana, se inserta un `LeaderboardEntry`.

### Regla de oro arquitectónica
- **El backend es el ÚNICO árbitro de reglas.** El frontend nunca decide legalidad.
- **El AI Service NUNCA accede a MongoDB** ni guarda estado. Es stateless puro (CA-09).

---

## 3. Stack tecnológico justificado

### Runtime y orquestación
| Tecnología | Versión | Por qué | Alternativas descartadas |
|-----------|---------|---------|--------------------------|
| **Bun** | 1.3.x | Runtime + gestor de paquetes + test runner unificado y veloz. Workspaces nativos. | Node + pnpm (más piezas móviles) |
| **Docker Compose** | 4 servicios | Reproducibilidad local de todo el stack (3 HTTP + MongoDB). | k8s (overkill para MVP) |

### Backend
| Tecnología | Versión | Por qué |
|-----------|---------|---------|
| **Hono** | ^4.4.0 | Framework web minimalista, rápido, tipado, agnóstico de runtime (corre en Bun). |
| **MongoDB** | driver ^6.8.0 | Modelo de documentos encaja con `Game`/`Theme`/`UserSkin` sin migraciones rígidas. |
| **Stripe** | ^16.0.0 | Estándar de facto para pagos; Checkout hospedado reduce alcance PCI. |
| **@clerk/backend** | ^1.3.0 | Verificación de JWT de Clerk server-side (`verifyToken`). |

### AI Service
| Tecnología | Versión | Por qué |
|-----------|---------|---------|
| **Hono** | ^4.4.0 | Mismo framework, servicio aislado y stateless. |
| **Minimax + alfa-beta** | — | Decisión cerrada (ADR-005/RF-17). Se exploró A* adversarial y se **descartó** por alineación con el PRD y previsibilidad. Iterative deepening para respetar el presupuesto de tiempo (<2s p95, CA-10). |

### Frontend
| Tecnología | Versión | Por qué | Alternativas descartadas |
|-----------|---------|---------|--------------------------|
| **TanStack Start** | 1.99.14 | Meta-framework full-stack SSR sobre TanStack Router. Routing type-safe basado en archivos. | Next.js (más opinado, menos control del router type-safe) |
| **TanStack Router** | 1.99.13 | Routing 100% type-safe, search params tipados. | React Router (menos type-safety) |
| **vinxi** | 0.5.1 | Toolchain (servidor SSR + bundling) que usa TanStack Start. | — |
| **vite** | ^6.0.0 | Dev server + build. HMR. | webpack (más lento) |
| **React** | ^18.3.0 | Estándar UI. React 18.3 con SSR streaming (Float). | — |
| **@clerk/tanstack-start** | 0.4.13 | Integración oficial de Clerk con TanStack Start. | — |
| **CSS vanilla + custom properties** | — | **NO se usa Tailwind.** El handoff de diseño venía como CSS afinado (`globals.css` + `board.css`); portarlo directo da fidelidad pixel-perfect, **cero dependencias nuevas** y elimina riesgo Tailwind+vinxi. | Tailwind (descartado, ver SESSION_LOG 2026-06-02 parte 2) |

> **Nota sobre versiones TanStack:** las ~19 sub-dependencias de TanStack están **fijadas a la línea
> 1.99.x** vía un bloque `overrides` en el `package.json` raíz. Esto fue costoso de estabilizar
> (ver SESSION_LOG 2026-06-01). **No cambiar sin leer ese log.**

### Tests
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Vitest** | ^2.0.0 | Unit/integración (backend rules, ai-service, frontend). |
| **React Testing Library** | ^16.0.0 | Tests de componentes (Board, EndModal, etc.). |
| **Playwright** | ^1.60.0 | E2E en browser (requiere `libasound2` etc. en WSL). |

---

## 4. Estructura del proyecto

```
damas-pve/
├── prd.md                     ← spec absoluta (v2.2)
├── CLAUDE.md                  ← fuente de verdad operacional
├── SESSION_LOG.md             ← diario cronológico de cambios
├── HANDOFF_PROMPT.md          ← estado + tareas pendientes para la próxima sesión
├── PROJECT_BREAKDOWN.md       ← este documento
├── docker-compose.yml         ← 4 servicios
├── .env.example               ← env vars documentadas
├── package.json               ← workspace root + overrides TanStack
├── packages/
│   └── shared/src/types.ts    ← ÚNICA fuente de tipos TS (Board, Game, Move, Theme…)
├── backend/
│   ├── src/
│   │   ├── index.ts           ← entry Hono, monta rutas
│   │   ├── db/                ← connectDb(), col.*(), seed.ts
│   │   ├── clerk/middleware.ts← requireAuth, getClerkUser
│   │   ├── rules/             ← moveGenerator, moveValidator, gameEnd
│   │   ├── routes/            ← games, leaderboard, themes, me
│   │   └── stripe/            ← checkout.ts, webhook.ts
│   └── tests/rules.test.ts    ← CA-01..CA-07 (19 tests)
├── ai-service/
│   ├── src/                   ← index, routes, minimax, heuristic, moveGen
│   └── tests/ai.test.ts       ← CA-09, CA-10
├── frontend/
│   ├── app.config.ts          ← config TanStack Start (appDirectory: "src", HMR port)
│   ├── src/
│   │   ├── client.tsx         ← entry cliente (hydrateRoot)
│   │   ├── ssr.tsx            ← entry servidor (createStartHandler)
│   │   ├── router.tsx        ← createRouter(routeTree)
│   │   ├── lib/api.ts        ← funciones de API tipadas
│   │   ├── lib/skins.ts      ← mapeo theme backend → skin de diseño
│   │   ├── components/       ← Board, Piece, Leaderboard, ui/*
│   │   ├── routes/           ← __root, index, play, leaderboard, shop, me
│   │   └── styles/           ← globals.css, board.css
│   └── tests/                 ← RTL (Board, EndModal, etc.)
└── e2e/
    ├── http-audit.ts          ← 16 checks HTTP sin browser
    ├── audit.spec.ts          ← Playwright
    └── verify-login.mjs       ← verificación de hidratación headless (nuevo)
```

### Convenciones
- **Componentes:** PascalCase (`ScrollySection`). **Hooks:** prefijo `use`. **CSS:** kebab-case.
- **Organización por feature/dominio**, no por tipo de archivo.
- **Tipos compartidos** SIEMPRE en `packages/shared/src/types.ts` (única fuente de verdad).
- **Imports con extensión `.ts`** en backend/ai-service (proyectos Bun;
  `allowImportingTsExtensions: true`).

---

## 5. Configuración y entorno de desarrollo

### Variables de entorno (`.env`)
```bash
MONGODB_URI=mongodb://admin:secret@localhost:27017/damas?authSource=admin
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # de: stripe listen --forward-to localhost:3001/api/stripe/webhook
AI_SERVICE_URL=http://localhost:3002      # http://ai-service:3002 en Docker
FRONTEND_URL=http://localhost:3000
# Price IDs de Stripe para las skins (reenviados al backend vía docker-compose):
STRIPE_PRICE_CLASSIC_WOOD=price_...
STRIPE_PRICE_NEON_GLOW=price_...
STRIPE_PRICE_MARBLE_BOARD=price_...
STRIPE_PRICE_VECTOR_CLASSIC=price_...
STRIPE_PRICE_RETRO_PIXEL=price_...
```
- **Cliente (Vite):** `VITE_CLERK_PUBLISHABLE_KEY` y `VITE_API_URL` se inyectan al contenedor
  frontend en `docker-compose.yml`. Vite solo expone al cliente vars con prefijo `VITE_`.

### Comandos (desarrollo)
```bash
bun install --ignore-scripts          # workspace root (--ignore-scripts evita el hook prepare sin repo git)
docker compose build --no-cache       # build limpio
docker compose up -d                  # arranca los 4 servicios
docker exec damas-backend bun run /app/backend/src/db/seed.ts   # seed de skins (DENTRO del contenedor)
```

### Configuraciones especiales
- **`app.config.ts`:** `tsr: { appDirectory: "src" }` porque las rutas viven en `src/`, no en `app/`.
  HMR fijado al puerto **24678** (expuesto en Docker; antes era aleatorio y Docker no lo exponía).
- **SSR en dev mode:** `<Scripts/>` de TanStack Start requiere un build manifest que solo existe en
  producción. En dev, `__root.tsx` usa un bootstrap inline que instala el preamble de React e importa
  `/_build/src/client.tsx` para arrancar Vite HMR y cargar los CSS. Ver §10.
- **Hidratación del cliente:** `client.tsx` llama `hydrateRoot(document, <StartClient/>)`. Sin esto,
  el SSR renderiza pero la página queda inerte (ver §6 y §10).

---

## 6. Capa de autenticación (Clerk)

### Integración
- `__root.tsx` envuelve la app en `<ClerkProvider>`. Los componentes de control `<SignedIn>`,
  `<SignedOut>`, `<SignInButton mode="modal">`, `<UserButton>` gestionan la UI según el estado de sesión.
- La publishable key llega al cliente vía `VITE_CLERK_PUBLISHABLE_KEY` (leída automáticamente por
  `@clerk/tanstack-start`).
- **Backend:** `clerk/middleware.ts` valida el JWT en cada request protegido:

```ts
import { createClerkClient, verifyToken } from "@clerk/backend";
// ...
const payload = await verifyToken(token, { secretKey: process.env["CLERK_SECRET_KEY"] ?? "" });
const clerkUserId = payload.sub;
```

### Flujo de login
1. Usuario hace click en "Iniciar sesión" (`<SignInButton mode="modal">`).
2. Clerk abre su modal hospedado; el usuario se autentica.
3. El SDK de Clerk en el cliente actualiza el estado → `<SignedIn>` renderiza el área autenticada.
4. Las llamadas a la API adjuntan el JWT de Clerk; el backend lo verifica con `verifyToken`.

### Por qué Clerk (vs alternativas)
| Criterio | Clerk | Auth0 | NextAuth | Supabase Auth |
|----------|-------|-------|----------|---------------|
| Integración TanStack Start | Oficial (`@clerk/tanstack-start`) | Genérica | Atada a Next.js | Genérica |
| UI lista (modal, UserButton) | ✅ | Parcial | ❌ (DIY) | Parcial |
| Verificación JWT server-side | ✅ `verifyToken` | ✅ | ✅ | ✅ |

Se eligió Clerk por su integración oficial con TanStack Start y componentes de UI listos, minimizando
código de auth propio. **NextAuth** se descartó por su acoplamiento a Next.js (no se usa aquí).

### Sobre `__clerk_init_state = undefined`
**No es un error.** Es el hint del SSR para un usuario **sin sesión activa**. Clerk inicializa
correctamente en el cliente (el log `Clerk has been loaded with development keys` lo confirma).
El bug real que parecía "login roto" era la falta de hidratación del cliente (ver §10).

---

## 7. Enrutamiento y estado (TanStack Router + SSR)

### Cómo funciona
- **Routing basado en archivos** en `frontend/src/routes/`. `routeTree.gen.ts` se genera
  automáticamente en el primer `vinxi dev` (no está en el repo).
- **Entradas:** `ssr.tsx` (`createStartHandler(createRouter)(defaultStreamHandler)`) en el servidor;
  `client.tsx` (`hydrateRoot`) en el cliente. Ambas comparten `router.tsx`.
- **Dehydrate/hydrate:** TanStack Start serializa el estado del router en `__TSR_SSR__.dehydrated`
  y lo rehidrata en el cliente. `loaderData: {"$undefined":0}` es la serialización normal de loaders
  vacíos — **las rutas actuales no usan loaders**; los datos se piden con `fetch` tras montar.

### Estado
- **Estado de servidor (juego, leaderboard, skins):** se pide con `fetch` tipado en `lib/api.ts` y se
  guarda en estado local de componente. **NO** se usa react-query/SWR actualmente.
- **Estado de auth:** lo gestiona Clerk (contexto de `ClerkProvider`).
- **Estado de UI (tabs de leaderboard, selección en el tablero):** estado local de React.

### Por qué TanStack Router/Start (vs React Router / Next.js)
- **Type-safety de extremo a extremo** en rutas y params, superior a React Router.
- **Control fino del router** y SSR sin la opinión pesada de Next.js.
- Trade-off: ecosistema más joven y **frágil en versiones** (de ahí el bloque `overrides`).

---

## 8. Comunicación con el backend/API

### Estrategia
`fetch` nativo tipado en `frontend/src/lib/api.ts`. **No** se usa axios ni react-query — se eligió
mantener cero dependencias extra para el data-fetching del MVP (KISS/YAGNI).

### Endpoints principales (backend :3001)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/games` | Clerk | Crea partida `{difficulty}` |
| GET | `/api/games` | Clerk | Lista partidas del usuario |
| GET | `/api/games/:id` | Clerk | Obtiene partida |
| POST | `/api/games/:id/moves` | Clerk | `{path}` → `{game, lastAiMove?}` |
| GET | `/api/games/:id/legal-moves` | Clerk | `Move[]` |
| DELETE | `/api/games/:id` | Clerk | Abandona partida |
| GET | `/api/leaderboard?difficulty&limit` | público | `LeaderboardEntry[]` |
| GET | `/api/themes` | público | `Theme[]` |
| POST | `/api/themes/:id/purchase` | Clerk | `{checkoutUrl}` (Stripe) |
| POST | `/api/stripe/webhook` | firma Stripe | Desbloquea skin |
| GET | `/api/me` | Clerk | `{user, skins, activeTheme}` |
| PUT | `/api/me/active-theme` | Clerk | `{themeId}` → 200 \| 403 |

### Códigos de error
`ILLEGAL_MOVE` (409), `SKIN_NOT_OWNED` (403), `GAME_OVER` (409), `AI_SERVICE_ERROR` (502),
`UNAUTHORIZED` (401), `STRIPE_ERROR` (502).

### AI Service (:3002, interno)
`POST /internal/ai/move` (AiMoveRequest → AiMoveResponse), `GET /health`.

---

## 9. Estilos y UI

- **CSS vanilla con custom properties** (`frontend/src/styles/globals.css` + `board.css`).
  **No hay Tailwind, CSS-in-JS ni CSS Modules.**
- **Dirección de diseño:** "dark luxury" — warm-black + oro/ámbar, tipografía Playfair Display + Inter.
- **Design tokens** como variables CSS (color, tipografía fluida con `clamp()`, spacing, easing).
- **Skins:** `lib/skins.ts` mapea el `_id` del theme del backend a un set de variables CSS
  (`--h1/h2/hk`, `--a1/a2/ak`) + flair por `[data-skin]` (neon glow, pixel hard-edges, wood grain).
  Los discs son themeable vía esas vars; los SVG placeholder de INV-01 ya no se usan para el render.
- **Responsividad:** mobile-first hasta 375px (grids colapsan a 1 columna).
- **Accesibilidad:** focus-visible (gold rings), `prefers-reduced-motion`, tabs como radiogroup.

---

## 10. Manejo de errores y logs actuales

### Análisis de los logs de consola observados
| Log | ¿Qué es? | ¿Bloquea? | Estado |
|-----|----------|-----------|--------|
| `__clerk_init_state = undefined` | Hint SSR de usuario sin sesión | No | Normal |
| `<Scripts /> found no manifest` | Manifest solo existe en `vinxi build` (prod) | No | Esperado en dev |
| `/@react-refresh 404` | Path del bootstrap externo sin prefijo `/_build/` | No | Inofensivo (try/catch) |
| `WebSocket ws://localhost:24678 … failed` | HMR de Vite no completa handshake bajo Docker/WSL | No (solo hot-reload) | Conocido |
| `502 /api/themes/:id/purchase` | **Bug real (resuelto)** | Sí (tienda) | ✅ Arreglado |

### Bug crítico 1 — Cliente nunca hidrataba (causa del "login roto")
`client.tsx` solo hacía `export default function App()` sin montar React. Resultado: SSR renderizado
pero **inerte** → sin Clerk → botón de login no clickeable, CSS sin aplicar (con el bootstrap viejo).

```tsx
// frontend/src/client.tsx — FIX
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";
const router = createRouter();
hydrateRoot(document, <StartClient router={router} />);
```

### Bug crítico 2 — Checkout Stripe 502 (`resource_missing`)
Las vars `STRIPE_PRICE_*` estaban en `.env` pero **no se reenviaban al contenedor backend**. El seed
guardó `price_placeholder_*` en MongoDB → Stripe los rechazaba. **Fix:** añadir las 5 vars al servicio
backend en `docker-compose.yml` + recrear + reseed. Verificado con una sesión real (`cs_test_...`).

### Bug crítico 3 — Webhook Stripe roto bajo Bun
`webhook.ts` usaba `constructEvent` (síncrono). Bajo Bun, el `SubtleCryptoProvider` de Stripe solo
computa HMAC async → toda firma válida devolvía `400 INVALID_SIGNATURE` → los desbloqueos de skin
(CA-17) se perderían en silencio.

```ts
// backend/src/stripe/webhook.ts — FIX
event = await getStripe().webhooks.constructEventAsync(rawBody, sig, webhookSecret);
```

---

## 11. Pruebas y calidad

| Capa | Framework | Cobertura |
|------|-----------|-----------|
| Backend reglas | Vitest | 19 tests (CA-01..CA-07), objetivo ≥80% en `src/rules` y `src/stripe` |
| AI Service | Vitest | 6 tests (CA-09 stateless, CA-10 <2s p95) |
| Frontend | Vitest + RTL | 30 tests (Board, EndModal, DifficultyBadge, Leaderboard, skins, StaticBoard) |
| E2E HTTP | script Bun | `e2e/http-audit.ts` — 16 checks (sin browser) |
| E2E browser | Playwright | `e2e/audit.spec.ts` + `e2e/verify-login.mjs` (requiere libs de sistema) |

### Estrategia
- **TDD** para nuevas features (RED → GREEN → REFACTOR).
- Los **typechecks** (`tsc --noEmit`) corren limpios (EXIT:0) en los 3 servicios.
- **CA (Criterios de Aceptación)** numerados (CA-01..CA-22) trazan requisitos a tests.
- El motor de reglas (backend) es la fuente de verdad y tiene la cobertura más estricta.

---

## 12. Rendimiento y optimizaciones

- **SSR streaming** con TanStack Start (React 18 Float) para first paint rápido.
- **AI Service** con iterative deepening + alfa-beta para cumplir `<2s p95` en `hard` (CA-10).
- **Índices MongoDB** ya creados: `games {clerkUserId,status}` + `{clerkUserId,updatedAt:-1}`,
  `userSkins {clerkUserId,themeId}` unique, `leaderboard {difficulty,movementsToWin,gameDurationMs,endedAt}`.
- **Code splitting / lazy loading:** **PENDIENTE DE ACLARAR** — no se observa configuración explícita;
  TanStack Router hace split por ruta por defecto.
- **Métricas LCP/INP/CLS reales:** **PENDIENTE DE ACLARAR** — no hay mediciones registradas.
- **CDN / caché de assets:** **PENDIENTE DE ACLARAR** — no configurado para el MVP (Docker local).

---

## 13. Seguridad

- **Autenticación:** Clerk; JWT verificado server-side con `verifyToken` en cada ruta protegida.
- **Autorización:** las rutas de juego/perfil exigen `requireAuth`; `PUT /me/active-theme` devuelve
  `403 SKIN_NOT_OWNED` si la skin no fue comprada.
- **Reglas server-side:** el cliente nunca decide legalidad; el backend ignora board/timestamps del
  cliente (`startedAt`/`endedAt` fijados server-side — CA-08, CA-11).
- **Pagos:** Stripe Checkout hospedado (menor alcance PCI). Desbloqueos **solo** vía webhook con
  **firma verificada** (`STRIPE_WEBHOOK_SECRET`). Idempotencia vía `$setOnInsert` (CA-17).
- **Secretos:** en `.env` / env vars del contenedor, nunca hardcodeados.
- **CSP / headers de seguridad de producción:** **PENDIENTE DE ACLARAR** — no configurados aún.

---

## 14. Despliegue y operaciones

- **Local/dev:** Docker Compose con 4 servicios (frontend, backend, ai-service, mongodb).
- **Plataforma de producción:** **PENDIENTE DE ACLARAR** — no definida; el MVP corre en Docker.
- **CI/CD:** **PENDIENTE DE ACLARAR** — no hay pipeline cloud. Existen **git hooks** locales
  (`scripts/install-hooks.sh`, pre-commit/pre-push).
- **Pendiente para producción (de CLAUDE.md §13):**
  - Endpoint de webhook de Stripe configurado en el dashboard apuntando al dominio real.
  - Instancia de producción de Clerk (claves de producción).
  - Assets SVG/PNG reales para las skins.
  - En prod, `<Scripts/>` usaría el manifest de `vinxi build` (no el bootstrap de dev).

---

## 15. Limitaciones y deuda técnica conocida

| Tema | Detalle |
|------|---------|
| **Fragilidad de versiones TanStack** | El bloque `overrides` (~19 paquetes a 1.99.x) es delicado; actualizar requiere mucho cuidado. |
| **Bootstrap de dev "house of cards"** | El arranque del cliente en dev depende de varios hacks (preamble, import de `/_build/src/client.tsx`, HMR port). En prod se reemplaza por el manifest. |
| **HMR WebSocket inestable en WSL/Docker** | Cambios SSR requieren `docker compose restart frontend` (inotify inestable en WSL2). |
| **Sin react-query/caché de datos** | El data-fetching es `fetch` manual; sin revalidación automática ni dedupe. |
| **Assets de skins placeholder (INV-01)** | SVG de alta calidad pero no definitivos. |
| **Sin métricas de performance ni CSP** | PENDIENTE DE ACLARAR. |
| **Análisis post-partida (RF-37)** | Diferido a v2; el historial de movimientos ya se persiste. |

---

## 16. Próximos pasos y roadmap sugerido

### Inmediato (verificación end-to-end)
1. ✅ Login + CSS + Clerk (verificado en browser headless).
2. ✅ Checkout Stripe (sesión real creada).
3. ✅ Webhook (firma válida → UserSkin persistido).
4. **Pendiente:** golden path manual completo — crear partida → jugar vs IA → fin → leaderboard →
   comprar skin (tarjeta test `4242 4242 4242 4242`, con `stripe listen` activo) → activar en `/me`.

### Corto plazo
- Estabilizar el flujo de webhook real con el Stripe CLI (verificar que `whsec` del `.env` coincida).
- Assets reales de skins (INV-01).

### Largo plazo (arquitectónico)
- Reemplazar el bootstrap de dev por el flujo de producción (`vinxi build` + manifest) para eliminar
  los hacks de SSR/HMR.
- Evaluar react-query/SWR para data-fetching con caché y revalidación.
- Definir plataforma de despliegue + CI/CD + CSP y headers de seguridad.
- Análisis post-partida (RF-37) en v2.

---

## Conclusiones y recomendaciones

**Damas PvE** es un MVP con una arquitectura limpia y bien delimitada: un monorepo Bun de 4 workspaces
donde el **backend es el único árbitro de reglas**, el **AI Service es stateless puro**, y la
monetización está aislada detrás de Stripe + webhooks firmados. Las decisiones de stack (Hono, MongoDB,
TanStack Start, Clerk, CSS vanilla) son coherentes con un MVP que prioriza control y baja superficie de
dependencias.

La percepción de "login roto" **no era un problema de Clerk** sino de **hidratación del cliente**
(`client.tsx` no montaba React). Una vez resuelto, se descubrieron y corrigieron dos bugs más en la
cadena de monetización (Price IDs no propagados al contenedor; webhook sync incompatible con Bun).
Todos verificados end-to-end.

**Recomendaciones prioritarias:**
1. **Completar el golden path manual** para cerrar la verificación funcional del MVP.
2. **Reducir la deuda del bootstrap de dev** migrando al flujo de producción cuanto antes — es la
   mayor fuente de fragilidad.
3. **Congelar el stack TanStack** (ya hecho vía `overrides`) y documentar cualquier upgrade como ADR.
4. **Definir operaciones de producción** (despliegue, CI/CD, CSP, claves de prod de Clerk/Stripe).

> Áreas marcadas **PENDIENTE DE ACLARAR** (métricas de performance, CDN, CSP, plataforma de despliegue,
> CI/CD cloud) deben confirmarse con el equipo antes de un lanzamiento productivo.
