#!/usr/bin/env bash
# Installs git hooks for the damas-pve project
set -e

HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"

cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/usr/bin/env bash
set -e
echo "→ pre-commit: typecheck + lint"

cd "$(git rev-parse --show-toplevel)"

# Typecheck all packages
echo "  Checking backend..."
cd backend && bun run tsc --noEmit && cd ..

echo "  Checking ai-service..."
cd ai-service && bun run tsc --noEmit && cd ..

echo "  Checking frontend..."
cd frontend && bun run tsc --noEmit && cd ..

echo "  Checking shared..."
cd packages/shared && bun run tsc --noEmit && cd ../..

echo "✓ pre-commit passed"
EOF

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/usr/bin/env bash
set -e
echo "→ pre-push: running full Vitest suite"

cd "$(git rev-parse --show-toplevel)"

echo "  Testing backend (rules + integration)..."
cd backend && bun test && cd ..

echo "  Testing ai-service..."
cd ai-service && bun test && cd ..

echo "  Testing frontend..."
cd frontend && bun test && cd ..

echo "✓ pre-push passed — all tests green"
EOF

chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-push"

echo "Git hooks installed successfully:"
echo "  .git/hooks/pre-commit  → typecheck all packages"
echo "  .git/hooks/pre-push    → full Vitest suite"
