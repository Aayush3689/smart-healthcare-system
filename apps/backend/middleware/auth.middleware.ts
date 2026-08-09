import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";
import type { JwtService } from "../utils/jwt.js";
export interface AuthRequest extends Request {
  auth?: { userId: string; role: Role };
}
export class AuthMiddleware {
  public constructor(private readonly jwtService: JwtService) {}
  public authenticate = (request: AuthRequest, _response: Response, next: NextFunction): void => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new AppError("Authentication is required.", 401, "UNAUTHENTICATED"));
    try {
      const payload = this.jwtService.verify(token);
      request.auth = { userId: payload.sub, role: payload.role };
      next();
    } catch {
      next(new AppError("Your access token is invalid or expired.", 401, "INVALID_ACCESS_TOKEN"));
    }
  };
  public allowRoles =
    (...roles: Role[]) =>
    (request: AuthRequest, _response: Response, next: NextFunction): void => {
      if (!request.auth || !roles.includes(request.auth.role))
        return next(
          new AppError("You do not have permission to perform this action.", 403, "FORBIDDEN"),
        );
      next();
    };
}
