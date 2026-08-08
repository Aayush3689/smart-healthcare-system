import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  predictionController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  bulkPredictionValidation,
  createPredictionValidation,
  highRiskPredictionQueryValidation,
  predictionIdParamValidation,
  predictionStatisticsQueryValidation,
} from "./validation.js";

export const predictionRoutes = Router();

predictionRoutes.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
predictionRoutes.post(
  "/",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validate(createPredictionValidation),
  asyncHandler(predictionController.create),
);
predictionRoutes.post(
  "/bulk",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validate(bulkPredictionValidation),
  asyncHandler(predictionController.bulk),
);
predictionRoutes.get(
  "/high-risk",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  validationMiddleware.validateQuery(highRiskPredictionQueryValidation),
  asyncHandler(predictionController.highRisk),
);
predictionRoutes.get(
  "/statistics",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  validationMiddleware.validateQuery(predictionStatisticsQueryValidation),
  asyncHandler(predictionController.statistics),
);
predictionRoutes.get(
  "/:predictionId",
  validationMiddleware.validateParams(predictionIdParamValidation),
  asyncHandler(predictionController.get),
);
