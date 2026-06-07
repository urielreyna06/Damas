FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json ./
COPY bun.lock* ./

COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY ai-service/package.json ./ai-service/
COPY frontend/package.json ./frontend/

RUN bun install --ignore-scripts

COPY packages/shared ./packages/shared
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/app.config.ts frontend/tsconfig.json ./frontend/

WORKDIR /app/frontend
EXPOSE 3000
# --host binds to 0.0.0.0 so the dev server is reachable from outside the container
CMD ["bunx", "vinxi", "dev", "--host", "--port", "3000"]
