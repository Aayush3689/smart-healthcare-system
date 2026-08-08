import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";

async function start(): Promise<void> {
  await prisma.$connect();

  const server = app.listen(env.port, () => {
    console.log(`Backend listening: http://localhost:4000/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down.`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch(async (error: unknown) => {
  console.error("Unable to start backend:", error);
  await prisma.$disconnect();
  process.exit(1);
});
