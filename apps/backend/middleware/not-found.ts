import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      `Route ${request.method} ${request.originalUrl} was not found.`,
      404,
      "ROUTE_NOT_FOUND",
    ),
  );
};
