import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type { SyncService } from "./service.js";
import type { SyncChangesInput, SyncInput } from "./validation.js";
export class SyncController {
  public constructor(private readonly service: SyncService) {}
  private id(r: AuthRequest) {
    if (!r.auth) throw new AppError("Authentication is required.", 401);
    return r.auth.userId;
  }
  synchronize = async (r: AuthRequest & { body: SyncInput }, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.synchronize(this.id(r), r.body),
      "Synchronization completed.",
    );
  status = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.status(this.id(r), String(r.query.deviceId)),
      "Sync status fetched successfully.",
    );
  changes = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.changes(this.id(r), r.query as unknown as SyncChangesInput),
      "Changes fetched successfully.",
    );
}
