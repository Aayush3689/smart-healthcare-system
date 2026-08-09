import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

const nodeEnv = process.env.NODE_ENV ?? "development";

// Prisma commands run from apps/backend; runtime environment files are kept at
// the repository root so Docker Compose and the backend share one source.
config({ path: resolve(import.meta.dirname, "../../.env." + nodeEnv), override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
