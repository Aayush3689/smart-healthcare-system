import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../utils/app-error.js";

export const parseJson = (field: string, required = true): RequestHandler =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const value = request.body[field] as unknown;
    if (value === undefined) {
      if (required) next(new AppError(`${field} is required.`, 400, "VALIDATION_ERROR"));
      else next();
      return;
    }
    if (typeof value !== "string") {
      next(new AppError(`${field} must be a JSON string.`, 400, "VALIDATION_ERROR"));
      return;
    }
    try {
      request.body[field] = JSON.parse(value) as unknown;
      next();
    } catch {
      next(new AppError(`${field} must be valid JSON.`, 400, "VALIDATION_ERROR"));
    }
  };
