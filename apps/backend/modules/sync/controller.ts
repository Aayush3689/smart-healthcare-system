import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type { SyncService } from "./service.js";
import type { SyncPullInput, SyncPushInput, SyncRetryInput } from "./validation.js";

export class SyncController {
  public constructor(private readonly service: SyncService) {}

  push = async (request: AuthRequest & { body: SyncPushInput }, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.push(this.userId(request), request.body),
      "Offline changes processed.",
    );

  pull = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.pull(this.userId(request), request.query as unknown as SyncPullInput),
      "Server changes fetched.",
    );

  status = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.status(this.userId(request)),
      "Sync status fetched.",
    );

  retry = async (request: AuthRequest & { body: SyncRetryInput }, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.retry(this.userId(request), request.body),
      "Failed offline changes retried.",
    );

  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHORIZED");
    return request.auth.userId;
  }
}
