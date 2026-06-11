# Handoff Prompt — Damas PvE

> Copia el bloque de PASO 2 y pégalo como primer mensaje en la próxima sesión de Claude Code.
> Estado actualizado: **2026-06-11**
> Ver `SESSION_LOG.md` para el diario completo de cambios por sesión.
> Para estudiar el proyecto a fondo: `GUIA_DIDACTICA.md`.

---

## PASO 1 — Abrir Claude Code en el directorio correcto

```bash
# En WSL (Ubuntu)
cd /mnt/a/Claude/Projects/Damas
claude
```

El proyecto vive en: **`/mnt/a/Claude/Projects/Damas/`** (WSL) = **`A:\Claude\Projects\Damas\`** (Windows)

---

## PASO 2 — Pegar este prompt como primer mensaje

```
Lee CLAUDE.md y SESSION_LOG.md completos antes de hacer nada.
SESSION_LOG.md tiene el diario de todo lo corregido en sesiones anteriores.

El proyecto está en /mnt/a/Claude/Projects/Damas (WSL) = A:\Claude\Projects\Damas (Windows).

## Estado actual (al 2026-06-08)

Proyecto Damas PvE — monorepo Bun con 4 workspaces.

- packages/shared   → tipos TypeScript compartidos (única fuente de verdad)
- backend           → Hono + MongoDB + Clerk + Stripe (puerto 3001)
- ai-service        → Hono stateless (puerto 3002)
- frontend          → TanStack Start 1.99.x + vinxi 0.5.1 (puerto 3000)

## ✅ Sesión 2026-06-08 (parte 3) — Dificultad de la IA bajada en todos los niveles

`ai-service/src/minimax.ts` → `MAX_DEPTH`: easy 2→**1**, medium 4→**3**, hard 6→**5** (−1 ply
por nivel). Sin tocar pesos heurísticos ni time limit. Tests 6/6, ai-service reconstruido y healthy.
Reversible: restaurar 2/4/6 + rebuild ai-service. Ver SESSION_LOG.md (parte 3).

## ✅ Sesión 2026-06-08 (parte 2) — Fix ACCESO A PARTIDA (`<Outlet/>` faltante) — ¡YA SE PUEDE JUGAR!

**Causa raíz (no era Clerk ni loading):** `/play/$gameId` es ruta HIJA de `/play`, pero
`play.tsx` no renderizaba `<Outlet/>` → al pulsar "Continuar" la URL cambiaba pero el tablero
(`GamePage`) nunca montaba (ni se disparaba `GET /api/games/:id`). El usuario lo veía como carga
infinita.

**Fix (`frontend/src/routes/play.tsx`, branch `fix/match-loading`):** cede al hijo con
`const childMatches = useChildMatches(); if (childMatches.length > 0) return <Outlet/>;`.
Más fix A defensivo en `play.$gameId.tsx` (watchdog 8s + Reintentar + guard token nulo).

**Verificado EN VIVO** con sesión real (cookies de Clerk inyectadas, sin Google/CAPTCHA):
acceso → tablero renderiza; jugada real 5,0→4,1 → `POST /moves` 200 → IA responde →
"Tus movimientos: 1". HTTP audit 16/16, typecheck EXIT 0. Ver `MATCH_ACCESS_FIX.md`.
**Requiere rebuild frontend (HECHO):** `docker compose build frontend && docker compose up -d frontend`.
Inconsistencia menor pendiente: panel "Últimos movimientos" dice "Sin movimientos aún" con contador=1 (cosmético).

## ✅ Sesión 2026-06-08 — Diagnóstico consola + optimizeDeps (rebuild HECHO)

**Hallazgo principal:** la app YA estaba 100% funcional. Los 4 "errores conocidos" de
consola son TODOS de HMR/dev mode, no bugs de código. Verificado tras rebuild:
HTTP audit 16/16, loginVisible:true, clerkGlobal:true, CSS ok.

**Fix aplicado (`app.config.ts` → `optimizeDeps.include`):** pre-bundle de react, react-dom,
@tanstack/*, @clerk/tanstack-start. **Logró:** eliminar el `optimized dependencies changed.
reloading` → ya no hay full-page reload en primera visita (mejora DX). **NO logró:** el
WebSocket HMR 400 PERSISTE — causa raíz distinta (Vinxi levanta 2 dev servers que comparten
la config `server.hmr`; el segundo falla con "Port undefined is already in use"). El WS 400
es cosmético: el frontend NO usa HMR (sin volume mounts → rebuild por cambio, ver CLAUDE.md §9).

## ✅ Fixes aplicados en sesión 2026-06-07

1. **Gameplay carga infinita RESUELTO:** play.$gameId.tsx incluía getToken (Clerk)
   en los deps de los 4 useCallback (fetchGame, handleMoveSend, handlePlayAgain,
   handleAbandon) y un useEffect. getToken puede cambiar referencia entre renders,
   recreando callbacks → re-firando effects → race conditions → loading=true permanente.
   Fix: getToken eliminado de todos los deps (se invoca dentro del callback, no se captura).
   Mismo patrón corregido en shop.tsx (owned badges effect).

2. **UX/UI audit:**
   - EndModal: agregado botón × + backdrop click para cerrar sin navegar.
   - play.tsx: disabled={creating === d.id} — ya no bloquea todos los botones.
   - me.tsx: success message auto-limpia en 3 segundos.
   - globals.css: position: relative en .modal.

3. **Skins verificadas OK:** Las 5 skins (Classic Wood, Neon Glow, Marble Board,
   Vector Classic, Retro Pixel) muestran previews visualmente únicas en /shop.
   Screenshot confirmado. El mecanismo CSS (vars inline + board.css) funciona correctamente.

## ✅ Fixes de sesiones anteriores (ver SESSION_LOG.md para detalle)

- 503 RESUELTO: Volume mounts eliminados del frontend en docker-compose.yml.
- Seed con _id slugs: GET /api/themes devuelve "_id":"classic_wood" etc.
- Guard isLoaded/isSignedIn en play.$gameId.tsx.
- Hidratación cliente: hydrateRoot() en client.tsx.
- React preamble + HMR WebSocket (24678) configurados.
- Webhook Stripe: constructEventAsync (Bun-compatible).
- Checkout Stripe funcional. Typechecks EXIT:0.
- UI dark luxury: 6 pantallas + CSS en frontend/src/styles/.
- 16/16 HTTP audit pass · verify-login: loginVisible:true, clerkGlobal:true.

## ⚠️ IMPORTANTE — Al retomar

El fix de la sesión 2026-06-08 (`optimizeDeps` en `app.config.ts`) YA está buildeado.
Si los containers están parados, basta `docker compose up -d`.
NOTA sobre HMR: tras arrancar el frontend, espera ~10-15s a que Vite pre-bundlee antes de
correr el audit (si no, da `ERR_SOCKET_NOT_CONNECTED` por timing, no es un fallo real).
`verify-login.mjs` mostrará errorCount:4 — son los 4 errores HMR cosméticos esperados.

## ▶️ Primeros pasos al retomar

1. Arrancar stack:
   cd /mnt/a/Claude/Projects/Damas && docker compose up -d
2. Verificar: bun run e2e/http-audit.ts   # debe dar 16/16
3. Si MongoDB está vacío: docker exec damas-backend bun run /app/backend/src/db/seed.ts
4. Confirmar IDs de themes:
   curl -s http://localhost:3001/api/themes | grep '"_id"'
   # Esperado: "_id":"classic_wood" etc. (slugs, NO ObjectIds)

## ▶️ Golden path manual (pendiente — única tarea real)

En terminal aparte antes de empezar:
  stripe listen --forward-to localhost:3001/api/stripe/webhook

Flujo en el browser:
1. http://localhost:3000 → Ctrl+Shift+R → "Iniciar sesión y jugar" (Clerk modal)
2. /play → crear partida Fácil → jugar vs IA → tablero debe cargar SIN skeleton infinito
3. Fin de partida → modal debe tener botón × para cerrar sin navegar
4. /leaderboard → ver la partida ganada en el tab correcto
5. /shop → cada skin debe mostrar su preview ÚNICA (Classic Wood ≠ Neon Glow ≠ Marble etc.)
6. /shop → Comprar skin → 4242 4242 4242 4242, fecha futura, cualquier CVC
7. Webhook desbloquea la skin → activar en /me → skin activa en próxima partida
8. /play → nueva partida → tablero debe mostrar la skin activada

## Puertos Docker expuestos

| Puerto | Servicio           |
|--------|--------------------|
| 3000   | Frontend (HTTP)    |
| 24678  | Frontend HMR WS    |
| 3001   | Backend API        |
| 3002   | AI Service         |
| 27017  | MongoDB            |

## Comandos de rebuild y verificación

# Arranque normal (imágenes ya construidas):
docker compose up -d

# Verificar estado:
docker compose ps
docker logs damas-frontend --tail=20
docker logs damas-backend  --tail=10

# REBUILD — necesario cuando cambia código en frontend/src, public, o packages/shared:
docker compose build frontend && docker compose up -d frontend

# REBUILD backend (cambios en backend/src):
docker compose build backend && docker compose up -d backend

# Rebuild completo desde cero:
docker compose build --no-cache && docker compose up -d
docker exec damas-backend bun run /app/backend/src/db/seed.ts

# Seed (cuando MongoDB esté vacío o themes sin slugs):
docker exec damas-backend bun run /app/backend/src/db/seed.ts

# Auditoría HTTP (16 checks, sin browser):
cd /mnt/a/Claude/Projects/Damas && bun run e2e/http-audit.ts

# Verificación de hidratación (browser headless):
cd /mnt/a/Claude/Projects/Damas && node e2e/verify-login.mjs

## Tests

# Sin Docker:
cd backend    && bun test tests/rules.test.ts   # 19 pass — CA-01..CA-07
cd ai-service && bun test                       # 6 pass  — CA-09, CA-10
bun run --cwd frontend test                     # 30 tests RTL

# Con Docker:
docker exec damas-backend    bun test
docker exec damas-ai-service bun test

## ❌ Pendiente — en orden de prioridad

### 0. ✅ COMPLETADO (2026-06-11) — Overhaul webapp standalone

**Commit:** `d1f254d` (branch `feature/damas-overhaul`)
**Archivos:** engine.js, game.jsx, shared.js, board.css, play.html (+477 / −233 líneas)

- **Fase 1 engine.js:** RULES preset (english/spanish/international), boardSize 8/10,
  damas voladoras, forceMaximumCapture, promoteDuringCapture, aStarGreedy,
  aiMove remapeado (easy=random, medium=aStarGreedy, hard=minimax-d3, expert=minimax-d4).
- **Fase 2 play.html:** 4ª tarjeta Expert "Guardián Ancestral", selector de variante
  (Inglesas/Españolas/Internacional 10×10), handler wired a Store.createGame.
- **Fase 3 shared.js:** createGame(difficulty, rulesKey), renderStaticBoard dinámico.
- **Fase 4 game.jsx:** Board/Piece S=rules.boardSize, sqName y coords dinámicos
  (FILES[0..9] para 10×10), diffMeta expert, bitácora acumulada en playMove + exportar .txt.
- **Fase 5 board.css:** repeat(10,1fr) y piece 10% para data-size="10".

---

### 1. 🟡 Resolver algoritmo de IA (proyecto principal): A* vs Minimax (decisión + alinear código y docs)

**Contexto (auditado 2026-06-09, ver SESSION_LOG.md entrada de ese día):**
- El usuario recuerda haber pedido migrar a **A\*** y haber quitado Minimax de la documentación.
- El estado ACTUAL del repo es **Minimax + alfa-beta** (`ai-service/src/minimax.ts`). No existe
  `astar.ts`. Toda la doc describe Minimax. En una sesión previa A\* se implementó y luego se
  revirtió a Minimax (sin rastro en git — nada commiteado).

**Tarea para la próxima sesión (NO hacer antes de presentar):**
1. Confirmar con el usuario la decisión definitiva: **¿A\* o Minimax?**
2. Si **A\***: implementar `ai-service/src/astar.ts` (búsqueda adversarial), cablear `routes.ts`,
   `calibrate.ts` y `tests/ai.test.ts`; actualizar PRD (RF-17, ADR-005), GUIA_DIDACTICA,
   CLAUDE.md y PROJECT_BREAKDOWN para reflejar A\* y retirar Minimax. Mantener CA-09 (stateless)
   y CA-10 (`hard` < 2s p95).
3. Si **Minimax**: dejar todo como está (ya alineado) y cerrar formalmente la discrepancia en docs.
4. En cualquier caso: **commitear el resultado** para que quede rastro auditable en git.

**Nota infra para abrir el PR:** actualmente **no hay git remote** configurado. Antes de publicar
el repo en GitHub, hacer **scrub de secretos** (`SESSION_LOG.md` ~línea 718 tiene un `whsec_` real;
`.env` tiene claves Clerk/Stripe). Hay una rama local `docs/ai-algorithm-astar-todo` con este TODO.

---

### 2. Golden path — solo falta el tramo de Stripe
✅ Acceso a partida y ciclo de jugada (humano→IA) VERIFICADOS en vivo (sesión 2026-06-08 parte 2).
Falta el tramo de monetización: compra de skin con Stripe (requiere `stripe listen
--forward-to localhost:3001/api/stripe/webhook`), webhook desbloquea, activar en /me, skin en partida.

### 3. INV-01 — Assets SVG reales (cosmético, no bloquea MVP)
Los SVG en frontend/public/themes/{skin_id}/ son placeholders.
Las skins muestran CSS vars únicos correctamente (verificado con screenshot).
Para producción: reemplazar con assets reales. Convención: red-man, black-man, red-king, black-king.

### 4. Stripe webhook en producción
Configurar endpoint en Stripe dashboard apuntando al dominio de producción.

## Reglas que NUNCA se rompen

1. El backend es el ÚNICO árbitro de legalidad. El frontend nunca valida movimientos.
2. El AI Service NUNCA accede a MongoDB ni guarda estado entre llamadas.
3. Desbloqueos de skin SOLO vía webhook Stripe con firma verificada.
4. startedAt y endedAt SIEMPRE fijados server-side.
5. TypeScript estricto — sin any implícito.
6. Solo status="human_won" genera LeaderboardEntry.
7. NO tocar las versiones de TanStack en package.json sin leer SESSION_LOG.md.
8. El bootstrap en __root.tsx DEBE instalar el preamble de React antes del import().
9. seed.ts usa _id slugs (classic_wood etc.) — NO cambiar a ObjectIds.
10. NO agregar volume mounts al frontend en docker-compose.yml — /mnt/a/ no funciona en WSL2.
11. getToken de Clerk NUNCA va en arrays de deps de useCallback/useEffect — se invoca
    dentro del callback, no se captura. Incluirlo hace que los callbacks se recreen en cada
    render de Clerk → race conditions y potencial loading infinito.
12. play.tsx DEBE ceder a `<Outlet/>` cuando hay ruta hija activa (`useChildMatches`).
    `/play/$gameId` es hija de `/play`; sin `<Outlet/>` el tablero nunca monta y "Continuar"
    parece carga infinita. NO quitar ese return de Outlet. Ver CLAUDE.md §9.

## Si encuentras algo no cubierto

PARA. Pregunta antes de inventar. El PRD v2.2 (prd.md) tiene las decisiones cerradas.
```
