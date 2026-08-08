import { Router } from "express";
import { activeAccountMiddleware, authMiddleware, syncController } from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  syncPullValidation,
  syncPushValidation,
  syncRetryValidation,
  syncStatusValidation,
} from "./validation.js";

const router = Router();
router.use(
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  authMiddleware.allowRoles("ASHA_WORKER"),
);
router.post(
  "/push",
  validationMiddleware.validate(syncPushValidation),
  asyncHandler(syncController.push),
);
router.get(
  "/pull",
  validationMiddleware.validateQuery(syncPullValidation),
  asyncHandler(syncController.pull),
);
router.get(
  "/status",
  validationMiddleware.validateQuery(syncStatusValidation),
  asyncHandler(syncController.status),
);
router.post(
  "/retry",
  validationMiddleware.validate(syncRetryValidation),
  asyncHandler(syncController.retry),
);

export const syncRoutes = router;
