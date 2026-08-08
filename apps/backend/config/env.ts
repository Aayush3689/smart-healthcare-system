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

export const env = Object.freeze({
  nodeEnv,
  port,
  databaseUrl: required("DATABASE_URL"),
});
