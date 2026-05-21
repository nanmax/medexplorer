# MedExplorer

A web-based clinical document repository with a Windows Explorer–style interface.
Browse, search, upload, and organize medical records (patient files, lab results,
clinical trials, imaging, billing, archives) through a familiar tree + details layout.

## Stack

- **Backend** — Bun + Elysia + TypeScript, Drizzle ORM, PostgreSQL (hexagonal architecture)
- **Frontend** — Vue 3 (Composition API) + Vite + Tailwind, Pinia, Vue Query
- **Shared** — Zod DTOs reused across FE/BE
- **Tests** — Vitest unit & integration, Vue Test Utils, Playwright E2E
- **Monorepo** — Bun workspaces

## Repository layout

```
medexplorer/
├── apps/
│   ├── api/              # Elysia backend (hexagonal architecture)
│   └── web/              # Vue 3 frontend
├── packages/
│   ├── shared/           # Zod DTOs shared between FE and BE
│   └── ui/               # Reusable Vue UI components
├── tests/e2e/            # Playwright end-to-end tests
├── infra/postgres/       # SQL extensions bootstrap
└── docker-compose.yml    # Optional Postgres for local dev
```

## Prerequisites

- **Bun** ≥ 1.1
- **PostgreSQL 14+** with extensions `pgcrypto`, `ltree`, `pg_trgm`
  - Easiest: `bun run db:up` (uses `docker-compose.yml`, auto-creates the extensions)
  - Manual: connect to your DB and run
    `CREATE EXTENSION pgcrypto; CREATE EXTENSION ltree; CREATE EXTENSION pg_trgm;`

## Quickstart

```bash
# 1. Install dependencies (workspace-aware)
bun install

# 2. Copy and edit env
cp .env.example .env

# 3. Start Postgres (skip if you already have one running)
bun run db:up

# 4. Apply migrations and seed sample data
bun run db:migrate
bun run db:seed

# 5. Run the two apps in separate terminals
bun run dev:api      # API at http://localhost:3000
bun run dev:web      # Web at http://localhost:5173
```

Open <http://localhost:5173>. OpenAPI/Swagger docs at <http://localhost:3000/swagger>.

## Features

- **Folder tree** in the sidebar — lazy-loaded per expand, unlimited depth
- **Details panel** with **list** or **grid** view (`Name / Type / Size / Date Modified`)
- **New Folder**, **Upload Files**, **Delete** (folder + file) — via toolbar or right-click context menu
- **Search** across folders and files (PostgreSQL trigram, debounced)
- **Recent Activity** on the home page (persisted in `localStorage`)
- **Breadcrumb** navigation; **keyboard accessible** tree (←/→/Enter)
- **Real-time count refresh** — folders show "Syncing X Items" while data refetches

## REST API (v1)

Base: `/api/v1`

| Method | Path                          | Description                            |
|--------|-------------------------------|----------------------------------------|
| GET    | `/folders/roots`              | List root folders (cursor pagination)  |
| GET    | `/folders/:id`                | Folder details + breadcrumb            |
| GET    | `/folders/:id/children`       | Direct sub-folders (cursor pagination) |
| GET    | `/folders/:id/subtree?depth=N`| Subtree up to N levels (max 5)         |
| GET    | `/folders/:id/files`          | Files in folder (cursor pagination)    |
| POST   | `/folders`                    | Create folder                          |
| PATCH  | `/folders/:id`                | Rename folder                          |
| DELETE | `/folders/:id`                | Delete folder (cascade)                |
| POST   | `/folders/:id/files`          | Upload files (multipart)               |
| GET    | `/files/:id`                  | File details                           |
| DELETE | `/files/:id`                  | Delete file                            |
| GET    | `/search?q=&type=`            | Trigram search (folders, files, or all)|
| GET    | `/healthz`                    | Liveness probe                         |
| GET    | `/swagger`                    | OpenAPI UI                             |

## Testing

```bash
# Per-package
bun run --filter '@medexplorer/api' test:unit
bun run --filter '@medexplorer/api' test:integration   # uses in-memory repos, no DB needed
bun run --filter '@medexplorer/ui' test                # Vue component tests
bun run --filter '@medexplorer/web' test               # composables + components

# End-to-end (requires Postgres + seeded data + both dev servers)
bun install --cwd tests/e2e
bunx playwright install chromium
bun run test:e2e
```

## Scalability

Designed for **millions of folders and thousands of concurrent users**:

- **Adjacency list + ltree GIST** index — subtree queries are O(log n)
- **Trigram GIN** indexes on `name` for fast fuzzy search
- **Cursor (keyset) pagination** — constant time regardless of dataset size
- **Lazy loading** in the FE tree — only one level fetched per expand
- **In-process LRU cache** behind a port — swap for Redis without touching services
- **Rate limiting** + **stateless API** — ready to horizontally scale behind a load balancer

Stress-test with synthetic data:

```bash
bun run --filter '@medexplorer/api' db:stress-seed -- --folders 1000000 --depth 5 --fanout 12
```

## Architecture

Backend follows **hexagonal / clean architecture**:

- `domain/` — entities, value objects, repository ports (no framework)
- `application/` — services (use cases) that depend only on ports
- `infrastructure/` — Drizzle repositories implementing the ports, plus an in-memory `CachePort`
- `presentation/` — Elysia routes wired through a manual DI container

Services depend on interfaces, not concrete drivers — you can swap PostgreSQL for any
other store or the in-memory cache for Redis with zero changes to business logic.
