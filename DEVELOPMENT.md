# Backend Development Handoff

This local-only document describes the current backend foundation and is intended for developers or AI agents extending it. The public project overview remains in `README.md`.

## Current state

- `apps/backend` is a runnable Express + TypeScript backend using native Node ESM.
- The API is mounted under `/api/v1`. `GET /api/v1/health` is the health endpoint.
- Authentication is email OTP based through Nodemailer. There is no public signup endpoint: a seeded PHC admin provisions doctor and ASHA worker accounts.
- Startup connects Prisma to PostgreSQL before Express begins listening.
- Prisma is configured with the `prisma-client-js` provider, but `apps/backend/prisma/schema.prisma` contains only the PostgreSQL datasource and generator: no models or migrations exist yet.
- `modules/auth` is implemented and mounted at `/api/v1/auth`: OTP login, token refresh/logout, current-account access, email changes, and PHC-admin account provisioning. The remaining modules are scaffolding and are not mounted.
- Docker Compose development and production files start PostgreSQL only. They do not currently start the backend image.

## Architecture

```text
apps/backend/index.ts
  ├─ loads config/env.ts
  ├─ connects database/prisma.ts
  └─ starts app.ts
       └─ Express middleware + GET /health
```

`app.ts` must remain focused on application configuration and route mounting. It must not open database connections or call `listen`. `index.ts` owns process startup and graceful handling for `SIGINT`/`SIGTERM`.

## Key files

| File | Purpose |
| --- | --- |
| `apps/backend/app.ts` | Express app, JSON/urlencoded middleware, health route |
| `apps/backend/index.ts` | Database connection, HTTP listener, shutdown logic |
| `apps/backend/config/env.ts` | Finds repository root and loads `.env.<NODE_ENV>` |
| `apps/backend/database/prisma.ts` | Shared `PrismaClient` singleton |
| `apps/backend/prisma/schema.prisma` | Prisma schema — add all models here |
| `apps/backend/Dockerfile` | Multi-stage ESM backend image build |
| `docker-compose.dev.yml` | Development Postgres with a dedicated volume |
| `docker-compose.prod.yml` | Production Postgres with a dedicated volume |

## ESM rules

The backend is configured as ESM (`"type": "module"`) with TypeScript `module` and `moduleResolution` set to `NodeNext`.

All relative runtime imports in `.ts` source must end in `.js`, for example:

```ts
import { prisma } from "../../database/prisma.js";
```

Do not use CommonJS `require`, `module.exports`, or extensionless relative imports.

## Environment loading

`config/env.ts` walks up from the current working directory until it finds the repository root, then loads:

- `.env.development` by default
- `.env.production` for `NODE_ENV=production`
- the file assigned by `ENV_FILE`, if present

OS/container environment variables override the file. `DATABASE_URL` is required and `PORT` is validated. Import the exported `env` object in application code rather than scattering `process.env` reads.

Expected variables:

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-me
POSTGRES_DB=smart_healthcare
```

## Local workflow

```bash
cd apps/backend
npm install
npm run prisma:generate
```

Start development PostgreSQL from the repository root:

```bash
docker compose --env-file .env.development -f docker-compose.dev.yml up -d
```

Then run the API:

```bash
cd apps/backend
npm run dev
```

Commands:

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
```

## Docker database setup

| Environment | Env file | Host port | Named volume |
| --- | --- | --- | --- |
| Development | `.env.development` | `5434` | `smart-healthcare-postgres-dev-data` |
| Production | `.env.production` | `5433` | `smart-healthcare-postgres-prod-data` |

Compose receives `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` explicitly from the selected env file. Start production PostgreSQL using:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The backend Docker image must be built with the repository root as the context:

```bash
docker build -f apps/backend/Dockerfile -t smart-healthcare-backend .
```

Provide `DATABASE_URL` when running the container; do not bake credentials into the image.

## Current configuration caveat

`.env.development` currently uses host port `5432` in `DATABASE_URL`, but development Compose publishes Postgres to host port `5434`. A backend process running on the host will not connect until the URL is changed to `5434` or the Compose port is changed to `5432`.

`.env.production` uses database host `postgres`. This is correct when the backend runs as a service on the same Compose network; it does not work for a backend process launched directly from the host.

## Adding a feature

Use the existing module shape:

```text
modules/<feature>/
├── routes.ts       # HTTP router
├── controller.ts   # HTTP orchestration
├── service.ts      # business logic and transactions
├── repository.ts   # Prisma calls only
├── dto/            # request/response types
├── validators/     # validation
├── policies/       # authorization
├── mapper/         # database-to-DTO mapping
└── index.ts        # exported router/module API
```

Recommended sequence:

1. Add Prisma models, indexes, enums, and relations in `prisma/schema.prisma`.
2. Run `npm run prisma:generate` and create a named migration.
3. Implement repository queries with the shared `prisma` singleton.
4. Add service-level business rules and transactions.
5. Validate request input before controller/service logic.
6. Export the module router and mount it in `app.ts`, e.g. `app.use("/api/users", usersRouter)`.
7. Add tests under `apps/backend/tests`.

## Auth implementation and tests

Auth request schemas and their inferred request types are in `apps/backend/modules/auth/validation.ts`; response DTOs remain in `dto/auth.dto.ts`. OTP generation, hashing, comparison, and expiry live in `apps/backend/utils/otp.ts`, keeping the service focused on authentication workflow.

The Prisma CLI configuration is in `apps/backend/prisma.config.ts`. It loads the repository-level `.env.development` by default (or `.env.<NODE_ENV>`), so running Prisma from `apps/backend` receives `DATABASE_URL` without a manual shell export. The deprecated `package.json#prisma` block has been removed.

The implemented API contract is documented in `docs/backend/auth.md`. Run the auth validation and service-flow test suite with:

```bash
cd apps/backend
npm test
```

Centralized error handling, request validation, authentication/authorization, request logging, and the `/api/v1` prefix are implemented. CORS policy, structured logging, rate limiting, and database-backed integration tests still need production hardening.
