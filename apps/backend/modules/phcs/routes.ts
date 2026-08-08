import { Router } from "express";
import { activeAccountMiddleware, authMiddleware, phcController } from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  emptyPhcQueryValidation,
  statisticsQueryValidation,
  updatePhcValidation,
} from "./validation.js";

export const phcRoutes = Router();
phcRoutes.use(
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  authMiddleware.allowRoles("PHC_ADMIN"),
);
phcRoutes.get("/me", asyncHandler(phcController.me));
phcRoutes.patch(
  "/me",
  validationMiddleware.validate(updatePhcValidation),
  asyncHandler(phcController.update),
);
phcRoutes.get(
  "/me/villages/statistics",
  validationMiddleware.validateQuery(emptyPhcQueryValidation),
  asyncHandler(phcController.villageStatistics),
);
phcRoutes.get(
  "/me/overview",
  validationMiddleware.validateQuery(emptyPhcQueryValidation),
  asyncHandler(phcController.overview),
);
phcRoutes.get(
  "/me/statistics",
  validationMiddleware.validateQuery(statisticsQueryValidation),
  asyncHandler(phcController.statistics),
);
phcRoutes.get(
  "/me/disease-statistics",
  validationMiddleware.validateQuery(statisticsQueryValidation),
  asyncHandler(phcController.diseaseStatistics),
);
phcRoutes.get(
  "/me/asha-workers",
  validationMiddleware.validateQuery(emptyPhcQueryValidation),
  asyncHandler(phcController.ashaWorkers),
);
phcRoutes.get(
  "/me/operations",
  validationMiddleware.validateQuery(emptyPhcQueryValidation),
  asyncHandler(phcController.operations),
);
