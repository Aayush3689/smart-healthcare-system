import type { RequestHandler } from "express";

const statusLabel = (statusCode: number): string => {
  if (statusCode >= 500) return "ERROR";
  if (statusCode >= 400) return "WARN";
  return "INFO";
};

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    const duration = Math.round(performance.now() - startedAt);
    const label = statusLabel(response.statusCode).padEnd(5);
    console.log(
      `${new Date().toISOString()} [${label}] ${request.method} ${request.originalUrl} → ${response.statusCode} (${duration}ms)`,
    );
  });

  next();
};
