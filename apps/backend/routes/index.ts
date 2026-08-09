import { Router } from "express";
import {
  activeAccountMiddleware,
  assessmentController,
  authController,
  authMiddleware,
  predictionController,
} from "../container/index.js";
import { ashaRoutes } from "../modules/asha/index.js";
import { assessmentRoutes } from "../modules/assessments/index.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validationMiddleware } from "../middleware/validate.middleware.js";
import { patientIdParamValidation } from "../modules/assessments/validation.js";
import { predictionRoutes } from "../modules/predictions/index.js";
import {
  patientPredictionQueryValidation,
  predictionPatientParamValidation,
} from "../modules/predictions/validation.js";
import { AuthRoutes } from "../modules/auth/index.js";
import { syncRoutes } from "../modules/sync/index.js";
import {
  doctorReferralRoutes,
  phcReferralRoutes,
  referralRoutes,
} from "../modules/referrals/index.js";
import {
  appointmentRoutes,
  doctorAppointmentRoutes,
  phcAppointmentRoutes,
} from "../modules/appointments/index.js";
import { doctorRoutes, phcDoctorRoutes } from "../modules/doctors/index.js";
import {
  ashaClinicalSummaryRoutes,
  clinicalNoteRoutes,
  doctorClinicalNoteRoutes,
  patientClinicalNoteRoutes,
} from "../modules/clinical-notes/index.js";
import {
  ashaFollowUpRoutes,
  ashaPatientFollowUpRoutes,
  doctorFollowUpRoutes,
  followUpRoutes,
  phcFollowUpRoutes,
} from "../modules/follow-ups/index.js";
import { phcRoutes } from "../modules/phcs/index.js";
import { phcDashboardRoutes } from "../modules/phc-dashboard/index.js";
import { healthRoutes } from "../modules/health/index.js";
import { ashaVillageRoutes, phcVillageRoutes, villageRoutes } from "../modules/villages/index.js";

const ashaApiRoutes = Router();
ashaApiRoutes.use("/", ashaRoutes);
ashaApiRoutes.use("/me/follow-ups", ashaFollowUpRoutes);
ashaApiRoutes.use("/me/patients", ashaPatientFollowUpRoutes);
ashaApiRoutes.use("/me/patients", ashaClinicalSummaryRoutes);
ashaApiRoutes.use("/me/village", ashaVillageRoutes);

const doctorApiRoutes = Router();
doctorApiRoutes.use("/", doctorRoutes);
doctorApiRoutes.use("/me/referrals", doctorReferralRoutes);
doctorApiRoutes.use("/me/appointments", doctorAppointmentRoutes);
doctorApiRoutes.use("/me/clinical-notes", doctorClinicalNoteRoutes);
doctorApiRoutes.use("/me/follow-ups", doctorFollowUpRoutes);
doctorApiRoutes.get(
  "/me/patients/:patientId/predictions",
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  authMiddleware.allowRoles("DOCTOR"),
  validationMiddleware.validateParams(predictionPatientParamValidation),
  validationMiddleware.validateQuery(patientPredictionQueryValidation),
  asyncHandler(predictionController.patient),
);

const phcApiRoutes = Router();
phcApiRoutes.use("/", phcRoutes);
phcApiRoutes.use("/me/referrals", phcReferralRoutes);
phcApiRoutes.use("/me/appointments", phcAppointmentRoutes);
phcApiRoutes.use("/me/doctors", phcDoctorRoutes);
phcApiRoutes.use("/me/follow-ups", phcFollowUpRoutes);
phcApiRoutes.use("/me/villages", phcVillageRoutes);

const patientApiRoutes = Router();
patientApiRoutes.use("/", patientClinicalNoteRoutes);
patientApiRoutes.get(
  "/:patientId/assessments",
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  validationMiddleware.validateParams(patientIdParamValidation),
  asyncHandler(assessmentController.patientHistory),
);
patientApiRoutes.get(
  "/:patientId/predictions",
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  validationMiddleware.validateParams(predictionPatientParamValidation),
  validationMiddleware.validateQuery(patientPredictionQueryValidation),
  asyncHandler(predictionController.patient),
);

export class ApiRoutes {
  public readonly router = Router();
  public constructor() {
    this.router.use("/auth", new AuthRoutes(authController, authMiddleware).router);
    this.router.use("/asha", ashaApiRoutes);
    this.router.use("/assessments", assessmentRoutes);
    this.router.use("/predictions", predictionRoutes);
    this.router.use("/referrals", referralRoutes);
    this.router.use("/appointments", appointmentRoutes);
    this.router.use("/doctors", doctorApiRoutes);
    this.router.use("/phc", phcApiRoutes);
    this.router.use("/phc-dashboard", phcDashboardRoutes);
    this.router.use("/clinical-notes", clinicalNoteRoutes);
    this.router.use("/patients", patientApiRoutes);
    this.router.use("/follow-ups", followUpRoutes);
    this.router.use("/villages", villageRoutes);
    this.router.use("/sync", syncRoutes);
  }
}
const rootRoutes = Router();
rootRoutes.use("/health", healthRoutes);
rootRoutes.use("/api/v1", new ApiRoutes().router);

export const routes = rootRoutes;
