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
COPY ai-service/src ./ai-service/src
COPY ai-service/tsconfig.json ./ai-service/

WORKDIR /app/ai-service
EXPOSE 3002
CMD ["bun", "run", "src/index.ts"]
