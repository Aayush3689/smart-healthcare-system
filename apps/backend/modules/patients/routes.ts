import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  patientController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  createPatientValidation,
  patientIdParamValidation,
  patientListQueryValidation,
  patientTimelineQueryValidation,
  updatePatientValidation,
} from "./validation.js";

export const patientRoutes = Router();
patientRoutes.use(authMiddleware.authenticate, activeAccountMiddleware.verify);

patientRoutes.get(
  "/",
  authMiddleware.allowRoles("ASHA_WORKER", "DOCTOR", "PHC_ADMIN"),
  validationMiddleware.validateQuery(patientListQueryValidation),
  asyncHandler(patientController.list),
);
patientRoutes.post(
  "/",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validate(createPatientValidation),
  asyncHandler(patientController.create),
);
patientRoutes.get(
  "/:patientId/summary",
  authMiddleware.allowRoles("ASHA_WORKER", "DOCTOR", "PHC_ADMIN"),
  validationMiddleware.validateParams(patientIdParamValidation),
  asyncHandler(patientController.summary),
);
patientRoutes.get(
  "/:patientId/timeline",
  authMiddleware.allowRoles("ASHA_WORKER", "DOCTOR", "PHC_ADMIN"),
  validationMiddleware.validateParams(patientIdParamValidation),
  validationMiddleware.validateQuery(patientTimelineQueryValidation),
  asyncHandler(patientController.timeline),
);
patientRoutes.get(
  "/:patientId",
  authMiddleware.allowRoles("ASHA_WORKER", "DOCTOR", "PHC_ADMIN"),
  validationMiddleware.validateParams(patientIdParamValidation),
  asyncHandler(patientController.get),
);
patientRoutes.patch(
  "/:patientId",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validateParams(patientIdParamValidation),
  validationMiddleware.validate(updatePatientValidation),
  asyncHandler(patientController.update),
);
