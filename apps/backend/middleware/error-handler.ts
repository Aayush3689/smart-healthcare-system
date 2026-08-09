import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { sendError } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

interface PrismaErrorLike {
  code?: string;
  meta?: unknown;
}

function isPrismaError(error: unknown): error is PrismaErrorLike {
  return typeof error === "object" && error !== null && "code" in error;
}

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Something went wrong.";
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (isPrismaError(error) && error.code === "P2002") {
    statusCode = 409;
    code = "RESOURCE_CONFLICT";
    message = "A record with this value already exists.";
    details = error.meta;
  } else if (isPrismaError(error) && error.code === "P2025") {
    statusCode = 404;
    code = "RESOURCE_NOT_FOUND";
    message = "The requested record was not found.";
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = `${new Date().toISOString()} [${statusCode >= 500 ? "ERROR" : "WARN"}] ${request.method} ${request.originalUrl} → ${statusCode} ${code}: ${errorMessage}`;

  if (statusCode >= 500) {
    console.error(logMessage);
    if (env.nodeEnv !== "production" && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  } else {
    console.warn(logMessage);
  }

  return sendError(
    response,
    statusCode,
    message,
    code,
    env.nodeEnv === "production" ? undefined : details,
  );
};
