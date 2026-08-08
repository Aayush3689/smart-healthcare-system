import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import type { ActiveAccountMiddleware } from "../../middleware/active-account.middleware.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import type { SyncController } from "./controller.js";
import { syncChangesValidation, syncStatusValidation, syncValidation } from "./validation.js";
export class SyncRoutes {
  public readonly router = Router();
  public constructor(c: SyncController, auth: AuthMiddleware, active: ActiveAccountMiddleware) {
    this.router.use(auth.authenticate, active.verify, auth.allowRoles("ASHA_WORKER"));
    this.router.post(
      "/",
      validationMiddleware.validate(syncValidation),
      asyncHandler(c.synchronize),
    );
    this.router.get(
      "/status",
      validationMiddleware.validateQuery(syncStatusValidation),
      asyncHandler(c.status),
    );
    this.router.get(
      "/changes",
      validationMiddleware.validateQuery(syncChangesValidation),
      asyncHandler(c.changes),
    );
  }
}
