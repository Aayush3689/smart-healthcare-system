import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  villageController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  villageDiseaseStatisticsQueryValidation,
  villageFollowUpQueryValidation,
  villageHighRiskQueryValidation,
  villageIdParamValidation,
  villageListQueryValidation,
  villagePatientQueryValidation,
  villageReferralQueryValidation,
  villageStatisticsQueryValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
const id = validationMiddleware.validateParams(villageIdParamValidation);

export const villageRoutes = Router();
protect(villageRoutes);
villageRoutes.use(authMiddleware.allowRoles("ASHA_WORKER", "DOCTOR", "PHC_ADMIN"));
villageRoutes.get("/:villageId", id, asyncHandler(villageController.get));
villageRoutes.get("/:villageId/asha-workers", id, asyncHandler(villageController.ashaWorkers));
villageRoutes.get(
  "/:villageId/patients",
  id,
  validationMiddleware.validateQuery(villagePatientQueryValidation),
  asyncHandler(villageController.patients),
);
villageRoutes.get(
  "/:villageId/statistics",
  id,
  validationMiddleware.validateQuery(villageStatisticsQueryValidation),
  asyncHandler(villageController.statistics),
);
villageRoutes.get(
  "/:villageId/disease-statistics",
  id,
  validationMiddleware.validateQuery(villageDiseaseStatisticsQueryValidation),
  asyncHandler(villageController.diseaseStatistics),
);
villageRoutes.get(
  "/:villageId/high-risk-patients",
  id,
  validationMiddleware.validateQuery(villageHighRiskQueryValidation),
  asyncHandler(villageController.highRisk),
);
villageRoutes.get(
  "/:villageId/referrals",
  id,
  validationMiddleware.validateQuery(villageReferralQueryValidation),
  asyncHandler(villageController.referrals),
);
villageRoutes.get(
  "/:villageId/follow-ups",
  id,
  validationMiddleware.validateQuery(villageFollowUpQueryValidation),
  asyncHandler(villageController.followUps),
);

export const phcVillageRoutes = Router();
protect(phcVillageRoutes);
phcVillageRoutes.use(authMiddleware.allowRoles("PHC_ADMIN"));
phcVillageRoutes.get(
  "/",
  validationMiddleware.validateQuery(villageListQueryValidation),
  asyncHandler(villageController.phcVillages),
);
phcVillageRoutes.get("/:villageId", id, asyncHandler(villageController.phcVillage));

export const ashaVillageRoutes = Router();
protect(ashaVillageRoutes);
ashaVillageRoutes.use(authMiddleware.allowRoles("ASHA_WORKER"));
ashaVillageRoutes.get("/", asyncHandler(villageController.myAshaVillage));
