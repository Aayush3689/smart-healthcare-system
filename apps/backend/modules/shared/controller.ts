import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type { ModuleService } from "./types.js";

export class ModuleController {
  public constructor(private readonly service: ModuleService) {}
  public handle =
    (operation: string, status = 200, message = "Request completed successfully.") =>
    async (request: AuthRequest, response: Response): Promise<Response> => {
      if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
      return sendSuccess(
        response,
        status,
        await this.service.execute(operation, {
          userId: request.auth.userId,
          role: request.auth.role,
          params: request.params as Record<string, string>,
          query: request.query,
          body: request.body as Record<string, unknown>,
          file: request.file,
        }),
        message,
      );
    };
}
