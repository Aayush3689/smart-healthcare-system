import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import type { AccessPolicy } from "../common/policies/access.policy.js";
import { AppError } from "../utils/app-error.js";

export class ActiveAccountMiddleware {
  public constructor(private readonly access: AccessPolicy) {}
  public verify = async (request: AuthRequest, _response: Response, next: NextFunction) => {
    try {
      if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
      await this.access.requireActiveUser(request.auth.userId);
      next();
    } catch (error) {
      next(error);
    }
  };
}
