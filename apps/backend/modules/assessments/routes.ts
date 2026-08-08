import { Router } from "express";
import {
  activeAccountMiddleware,
  assessmentController,
  authMiddleware,
  predictionController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  assessmentIdParamValidation,
  assessmentListQueryValidation,
  completeAssessmentValidation,
  createAssessmentValidation,
  updateAssessmentValidation,
} from "./validation.js";

export const assessmentRoutes = Router();

assessmentRoutes.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
assessmentRoutes.get(
  "/",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  validationMiddleware.validateQuery(assessmentListQueryValidation),
  asyncHandler(assessmentController.list),
);
assessmentRoutes.post(
  "/",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validate(createAssessmentValidation),
  asyncHandler(assessmentController.create),
);
assessmentRoutes.get(
  "/:assessmentId",
  validationMiddleware.validateParams(assessmentIdParamValidation),
  asyncHandler(assessmentController.get),
);
assessmentRoutes.patch(
  "/:assessmentId",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validateParams(assessmentIdParamValidation),
  validationMiddleware.validate(updateAssessmentValidation),
  asyncHandler(assessmentController.update),
);
assessmentRoutes.post(
  "/:assessmentId/complete",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validateParams(assessmentIdParamValidation),
  validationMiddleware.validate(completeAssessmentValidation),
  asyncHandler(assessmentController.complete),
);
assessmentRoutes.get(
  "/:assessmentId/predictions",
  validationMiddleware.validateParams(assessmentIdParamValidation),
  asyncHandler(predictionController.assessment),
);
assessmentRoutes.get(
  "/:assessmentId/documents",
  validationMiddleware.validateParams(assessmentIdParamValidation),
  asyncHandler(assessmentController.documents),
);
