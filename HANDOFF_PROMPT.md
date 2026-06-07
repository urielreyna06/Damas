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

## ✅ Fixes aplicados en sesión 2026-06-04

1. **503 RESUELTO:** Volume mounts del frontend eliminados de docker-compose.yml.
   Docker Desktop en WSL2 no puede acceder a /mnt/a/ para bind mounts — montaba
   /app/frontend/src/ vacío → 503. Fix: frontend sin volumes. Cambios requieren rebuild.

2. **Skins preview RESUELTO:** seed.ts no fijaba _id → MongoDB generaba ObjectIds.
   THEME_ID_TO_SKIN mapea por slug (classic_wood) → nunca matcheaba → todas emerald.
   Fix: seed.ts con _id: "classic_wood" etc. + drop/recreate collection.
   GET /api/themes devuelve "_id":"classic_wood" etc. ✅

3. **Game loading RESUELTO:** play.$gameId.tsx llamaba fetchGame() sin esperar isLoaded
   de Clerk → getToken() podía colgar → skeleton infinito.
   Fix: guard isLoaded/isSignedIn en los useEffect de la game page.

## ✅ Verificado en sesiones anteriores

- Hidratación del cliente: client.tsx hace hydrateRoot() — login y CSS funcionan.
- Typechecks: tsc --noEmit EXIT:0 en los 3 servicios.
- Checkout Stripe funcional: sesión real creada.
- Webhook Stripe: constructEventAsync bajo Bun → firma válida → 200 → UserSkin (CA-17).
- React preamble y HMR WebSocket (puerto 24678) configurados.
- UI dark luxury: 6 pantallas rediseñadas, CSS en frontend/src/styles/.
- 16/16 HTTP audit pass · http://localhost:3000 → 200
- verify-login.mjs: loginVisible:true, clerkGlobal:true, CSS aplicado.

## ⚠️ IMPORTANTE — Rebuild necesario al retomar

Los cambios de la sesión 2026-06-04 fueron buildeados y están en las imágenes Docker.
Si los containers están parados, basta con `docker compose up -d`.
Si las imágenes se perdieron o hay duda, hacer rebuild completo (ver comandos abajo).

## ▶️ Primeros pasos al retomar

1. Arrancar stack:
   cd /mnt/a/Claude/Projects/Damas && docker compose up -d
2. Verificar: bun run e2e/http-audit.ts   # debe dar 16/16
3. Si MongoDB está vacío (themes 0): docker exec damas-backend bun run /app/backend/src/db/seed.ts
4. Verificar que GET /api/themes devuelve _id slug (no ObjectId):
   curl -s http://localhost:3001/api/themes | grep '"_id"'
   # Esperado: "_id":"classic_wood" etc.

## ▶️ Golden path manual en el browser (pendiente)

El stack funciona end-to-end y está verificado por automatización.
Falta la prueba manual del flujo completo:

Para el webhook de Stripe, abrir una terminal aparte:
  stripe listen --forward-to localhost:3001/api/stripe/webhook

Luego en el browser:
1. http://localhost:3000 → Ctrl+Shift+R → "Iniciar sesión y jugar" (Clerk modal)
2. /play → crear partida Fácil → jugar vs IA → verificar fin de partida
3. /leaderboard → ver la partida ganada en el tab correcto
4. /shop → cada skin debe mostrar su preview ÚNICA (no todas emerald)
5. /shop → Comprar skin → 4242 4242 4242 4242, fecha futura, cualquier CVC
6. Webhook desbloquea la skin → activar en /me → skin activa en próxima partida

## Puertos Docker expuestos

| Puerto | Servicio           |
|--------|--------------------|
| 3000   | Frontend (HTTP)    |
| 24678  | Frontend HMR WS    |
| 3001   | Backend API        |
| 3002   | AI Service         |
| 27017  | MongoDB            |

## Comandos de arranque y rebuild

# Arranque normal (imágenes ya construidas):
docker compose up -d

# Verificar estado:
docker compose ps
docker logs damas-frontend --tail=20
docker logs damas-backend  --tail=10

# REBUILD — necesario cuando cambia código fuente (no hay volume mounts):
# Frontend (cambios en frontend/src, frontend/public, packages/shared):
docker compose build frontend && docker compose up -d frontend

# Backend (cambios en backend/src, incluyendo seed.ts):
docker compose build backend && docker compose up -d backend

# Rebuild completo desde cero (si algo está muy roto):
docker compose build --no-cache && docker compose up -d
docker exec damas-backend bun run /app/backend/src/db/seed.ts

# Seed (ejecutar DESPUÉS de que el backend esté healthy):
docker exec damas-backend bun run /app/backend/src/db/seed.ts
# El seed hace drop+recreate de themes y userSkins.
# Resultado esperado: 5 themes con _id slug (classic_wood, neon_glow, etc.)

# Auditoría HTTP (16 checks, sin browser):
cd /mnt/a/Claude/Projects/Damas && bun run e2e/http-audit.ts

# Verificación de hidratación (browser headless, requiere Playwright):
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
Automatización verde. Falta probar manualmente login, gameplay, leaderboard,
compra de skin con Stripe y activación en /me.

### 2. INV-01 — Assets SVG reales (cosmético, no bloquea MVP)
Los SVG en frontend/public/themes/{skin_id}/ son placeholders.
Las skins ya muestran CSS vars únicas (board y piezas correctamente coloreados).
Para producción: reemplazar con assets reales (pngimg.com, itch.io, vecteezy.com).
Convención: {color}-{kind}.svg — red-man, black-man, red-king, black-king, preview.

### 3. Stripe webhook en producción
Configurar endpoint en Stripe dashboard apuntando al dominio de producción.
Hasta entonces: stripe listen para desarrollo local.

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
10. NO agregar volume mounts al frontend en docker-compose.yml — /mnt/a/ no es
    accesible desde Docker Desktop en WSL2.

## Si encuentras algo no cubierto

PARA. Pregunta antes de inventar. El PRD v2.2 (prd.md) tiene las decisiones cerradas.
```
