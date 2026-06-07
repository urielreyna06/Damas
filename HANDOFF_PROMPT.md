# Handoff Prompt — Damas PvE

> Copia el bloque de PASO 2 y pégalo como primer mensaje en la próxima sesión de Claude Code.
> Estado actualizado: **2026-06-07**
> Ver `SESSION_LOG.md` para el diario completo de cambios por sesión.

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

## Estado actual (al 2026-06-07)

Proyecto Damas PvE — monorepo Bun con 4 workspaces.

- packages/shared   → tipos TypeScript compartidos (única fuente de verdad)
- backend           → Hono + MongoDB + Clerk + Stripe (puerto 3001)
- ai-service        → Hono stateless (puerto 3002)
- frontend          → TanStack Start 1.99.x + vinxi 0.5.1 (puerto 3000)

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

## ⚠️ IMPORTANTE — Rebuild necesario al retomar

Los cambios de la sesión 2026-06-07 ya están buildeados (imagen reconstruida a las 17:40).
Si los containers están parados, basta con `docker compose up -d`.
Si las imágenes se perdieron o hay duda, hacer rebuild del frontend (ver comandos abajo).

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

### 1. Golden path manual en el browser
Automatización verde. Falta probar manualmente login, gameplay (¡ya sin carga infinita!),
leaderboard, compra de skin con Stripe y activación en /me con skin en partida.

### 2. INV-01 — Assets SVG reales (cosmético, no bloquea MVP)
Los SVG en frontend/public/themes/{skin_id}/ son placeholders.
Las skins muestran CSS vars únicos correctamente (verificado con screenshot).
Para producción: reemplazar con assets reales. Convención: red-man, black-man, red-king, black-king.

### 3. Stripe webhook en producción
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

## Si encuentras algo no cubierto

PARA. Pregunta antes de inventar. El PRD v2.2 (prd.md) tiene las decisiones cerradas.
```
