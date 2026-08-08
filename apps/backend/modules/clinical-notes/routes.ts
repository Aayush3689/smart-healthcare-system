import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  clinicalNoteController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  clinicalNoteIdParamValidation,
  clinicalNoteListQueryValidation,
  clinicalNotePatientParamValidation,
  createClinicalNoteValidation,
  emptyClinicalNoteActionValidation,
  updateClinicalNoteValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);

export const clinicalNoteRoutes = Router();
protect(clinicalNoteRoutes);
clinicalNoteRoutes.use(authMiddleware.allowRoles("DOCTOR"));
clinicalNoteRoutes.post(
  "/",
  validationMiddleware.validate(createClinicalNoteValidation),
  asyncHandler(clinicalNoteController.create),
);
clinicalNoteRoutes.get(
  "/:clinicalNoteId",
  validationMiddleware.validateParams(clinicalNoteIdParamValidation),
  asyncHandler(clinicalNoteController.get),
);
clinicalNoteRoutes.patch(
  "/:clinicalNoteId",
  validationMiddleware.validateParams(clinicalNoteIdParamValidation),
  validationMiddleware.validate(updateClinicalNoteValidation),
  asyncHandler(clinicalNoteController.update),
);
clinicalNoteRoutes.patch(
  "/:clinicalNoteId/finalize",
  validationMiddleware.validateParams(clinicalNoteIdParamValidation),
  validationMiddleware.validate(emptyClinicalNoteActionValidation),
  asyncHandler(clinicalNoteController.finalize),
);

export const patientClinicalNoteRoutes = Router();
protect(patientClinicalNoteRoutes);
patientClinicalNoteRoutes.use(authMiddleware.allowRoles("DOCTOR"));
patientClinicalNoteRoutes.get(
  "/:patientId/clinical-notes",
  validationMiddleware.validateParams(clinicalNotePatientParamValidation),
  validationMiddleware.validateQuery(clinicalNoteListQueryValidation),
  asyncHandler(clinicalNoteController.patientNotes),
);

export const doctorClinicalNoteRoutes = Router();
protect(doctorClinicalNoteRoutes);
doctorClinicalNoteRoutes.use(authMiddleware.allowRoles("DOCTOR"));
doctorClinicalNoteRoutes.get(
  "/",
  validationMiddleware.validateQuery(clinicalNoteListQueryValidation),
  asyncHandler(clinicalNoteController.myNotes),
);

export const ashaClinicalSummaryRoutes = Router();
protect(ashaClinicalSummaryRoutes);
ashaClinicalSummaryRoutes.use(authMiddleware.allowRoles("ASHA_WORKER"));
ashaClinicalSummaryRoutes.get(
  "/:patientId/clinical-summary",
  validationMiddleware.validateParams(clinicalNotePatientParamValidation),
  asyncHandler(clinicalNoteController.clinicalSummary),
);
