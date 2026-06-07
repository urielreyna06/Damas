FROM oven/bun:1 AS base
WORKDIR /app

# Workspace root — defines all members
COPY package.json ./
COPY bun.lock* ./

# ALL member package.jsons must exist before bun install resolves the graph
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY ai-service/package.json ./ai-service/
COPY frontend/package.json ./frontend/

# Install from workspace root — skip git-hooks prepare script
RUN bun install --ignore-scripts

# Copy only what this service needs at runtime
COPY packages/shared ./packages/shared
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

WORKDIR /app/backend
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
