import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function findProjectRoot(startDirectory: string): string {
  let directory = startDirectory;

  while (true) {
    if (existsSync(resolve(directory, "apps", "backend"))) {
      return directory;
    }

    const parent = resolve(directory, "..");
    if (parent === directory) {
      return startDirectory;
    }
    directory = parent;
  }
}

const projectRoot = findProjectRoot(process.cwd());
const nodeEnv = process.env.NODE_ENV ?? "development";
const envFile = process.env.ENV_FILE ?? resolve(projectRoot, `.env.${nodeEnv}`);

config({ path: envFile, override: false });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

const corsOrigins = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const env = Object.freeze({
  nodeEnv,
  port,
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  corsOrigins,
  ai: {
    baseUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
    timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 15000),
  },
  smtp: {
    host: required("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    from: required("SMTP_FROM"),
    user: required("SMTP_USER"),
    password: required("SMTP_PASSWORD"),
  },
});
