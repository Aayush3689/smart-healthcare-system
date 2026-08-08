import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

export class ValidationMiddleware {
  public validate<T>(schema: ZodType<T>): RequestHandler {
    return (request: Request, _response: Response, next: NextFunction): void => {
      const result = schema.safeParse(request.body);
      if (!result.success) {
        return next(
          new AppError(
            "Request validation failed.",
            400,
            "VALIDATION_ERROR",
            result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
      }
      request.body = result.data;
      next();
    };
  }
}

export const validationMiddleware = new ValidationMiddleware();
