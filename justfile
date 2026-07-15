# Smart Telescope Explorer — task runner.
# Thin wrappers over the package.json scripts; contributors without `just`
# can run the equivalent `pnpm` command directly.

# List available recipes.
default:
    @just --list

# Install workspace dependencies.
install:
    pnpm install

# Run the web app dev server (http://localhost:5173).
dev:
    pnpm --filter @ste/web dev

# Build every package and the web app.
build:
    pnpm build
    pnpm --filter @ste/web build

# Type-check all packages and the web app.
typecheck:
    pnpm typecheck

# Lint the repository.
lint:
    pnpm lint

# Fail on circular dependencies between packages.
cycles:
    pnpm cycles

# Run the test suite once.
test:
    pnpm test

# Run tests in watch mode.
test-watch:
    pnpm test:watch

# Format the repository with Prettier.
fmt:
    pnpm format

# Check formatting without writing.
fmt-check:
    pnpm format:check

# Run the full CI gate: typecheck + lint + cycles + test.
check:
    pnpm typecheck
    pnpm lint
    pnpm cycles
    pnpm test

# Run the engine harness on a fixture (F01..F07), e.g. `just harness F03`.
harness FIXTURE="F01":
    pnpm harness {{FIXTURE}} --formulas
