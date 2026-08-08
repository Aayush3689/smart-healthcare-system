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
  public validateQuery<T>(schema: ZodType<T>): RequestHandler {
    return (request: Request, _response: Response, next: NextFunction): void => {
      const result = schema.safeParse(request.query);
      if (!result.success)
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
      request.query = result.data as Request["query"];
      next();
    };
  }

  public validateParams<T>(schema: ZodType<T>): RequestHandler {
    return (request: Request, _response: Response, next: NextFunction): void => {
      const result = schema.safeParse(request.params);
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
      request.params = result.data as Request["params"];
      next();
    };
  }
}

export const validationMiddleware = new ValidationMiddleware();
