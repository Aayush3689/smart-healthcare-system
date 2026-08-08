import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Router } from "express";
import multer from "multer";
import {
  activeAccountMiddleware,
  appointmentController,
  ashaController,
  assessmentController,
  authMiddleware,
  predictionController,
  referralController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  assessmentIdParamValidation,
  completeAssessmentValidation,
  updateAssessmentValidation,
} from "../assessments/validation.js";
import {
  appointmentListQueryValidation,
  appointmentPatientParamValidation,
} from "../appointments/validation.js";
import {
  patientPredictionQueryValidation,
  predictionPatientParamValidation,
} from "../predictions/validation.js";
import { createPatientValidation, updatePatientValidation } from "../patients/validation.js";
import {
  createReferralValidation,
  referralIdParamValidation,
  referralListQueryValidation,
  referralPatientParamValidation,
} from "../referrals/validation.js";
import {
  ashaCreateAssessmentValidation,
  assessmentListValidation,
  correctExtractionValidation,
  dateRangeValidation,
  patientListValidation,
  updateAshaProfileValidation,
} from "./validation.js";
const directory = resolve(process.cwd(), "storage", "uploads");
mkdirSync(directory, { recursive: true });
const upload = multer({ dest: directory, limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
export const ashaRoutes = Router();
const c = ashaController;
const b = validationMiddleware;
ashaRoutes.use(
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  authMiddleware.allowRoles("ASHA_WORKER"),
);
ashaRoutes.get("/me", asyncHandler(c.profile));
ashaRoutes.patch("/me", b.validate(updateAshaProfileValidation), asyncHandler(c.update));
ashaRoutes.get("/me/dashboard", asyncHandler(c.dashboard));
ashaRoutes.get("/me/statistics", b.validateQuery(dateRangeValidation), asyncHandler(c.statistics));
ashaRoutes.get("/me/patients", b.validateQuery(patientListValidation), asyncHandler(c.patients));
ashaRoutes.post("/me/patients", b.validate(createPatientValidation), asyncHandler(c.createPatient));
ashaRoutes.get("/me/patients/:patientId", asyncHandler(c.patient));
ashaRoutes.patch(
  "/me/patients/:patientId",
  b.validate(updatePatientValidation),
  asyncHandler(c.updatePatient),
);
ashaRoutes.get("/me/patients/:patientId/assessments", asyncHandler(c.patientAssessments));
ashaRoutes.get(
  "/me/patients/:patientId/predictions",
  b.validateParams(predictionPatientParamValidation),
  b.validateQuery(patientPredictionQueryValidation),
  asyncHandler(predictionController.patient),
);
ashaRoutes.get(
  "/me/assessments",
  b.validateQuery(assessmentListValidation),
  asyncHandler(c.assessments),
);
ashaRoutes.post(
  "/me/assessments",
  b.validate(ashaCreateAssessmentValidation),
  asyncHandler(c.createAssessment),
);
ashaRoutes.get(
  "/me/assessments/:assessmentId",
  b.validateParams(assessmentIdParamValidation),
  asyncHandler(assessmentController.get),
);
ashaRoutes.patch(
  "/me/assessments/:assessmentId",
  b.validateParams(assessmentIdParamValidation),
  b.validate(updateAssessmentValidation),
  asyncHandler(assessmentController.update),
);
ashaRoutes.post(
  "/me/assessments/:assessmentId/complete",
  b.validateParams(assessmentIdParamValidation),
  b.validate(completeAssessmentValidation),
  asyncHandler(assessmentController.complete),
);
ashaRoutes.get(
  "/me/assessments/:assessmentId/predictions",
  b.validateParams(assessmentIdParamValidation),
  asyncHandler(assessmentController.predictions),
);
ashaRoutes.post(
  "/me/referrals",
  b.validate(createReferralValidation),
  asyncHandler(referralController.create),
);
ashaRoutes.get(
  "/me/referrals",
  b.validateQuery(referralListQueryValidation),
  asyncHandler(referralController.list),
);
ashaRoutes.get(
  "/me/patients/:patientId/referrals",
  b.validateParams(referralPatientParamValidation),
  b.validateQuery(referralListQueryValidation),
  asyncHandler(referralController.patient),
);
ashaRoutes.get(
  "/me/referrals/:referralId",
  b.validateParams(referralIdParamValidation),
  asyncHandler(referralController.get),
);
ashaRoutes.get(
  "/me/appointments",
  b.validateQuery(appointmentListQueryValidation),
  asyncHandler(appointmentController.list),
);
ashaRoutes.get(
  "/me/patients/:patientId/appointments",
  b.validateParams(appointmentPatientParamValidation),
  b.validateQuery(appointmentListQueryValidation),
  asyncHandler(appointmentController.patient),
);
ashaRoutes.get("/me/notifications", asyncHandler(c.notifications));
ashaRoutes.patch("/me/notifications/:notificationId/read", asyncHandler(c.read));
ashaRoutes.post("/me/notifications/read-all", asyncHandler(c.readAll));
ashaRoutes.post("/me/patients/:patientId/documents", upload.single("file"), asyncHandler(c.upload));
ashaRoutes.get("/me/patients/:patientId/documents", asyncHandler(c.documents));
ashaRoutes.post("/me/documents/:documentId/ocr", asyncHandler(c.startOcr));
ashaRoutes.get("/me/documents/:documentId/ocr", asyncHandler(c.ocr));
ashaRoutes.get("/me/documents/:documentId/extraction", asyncHandler(c.extraction));
ashaRoutes.patch(
  "/me/documents/:documentId/extraction",
  b.validate(correctExtractionValidation),
  asyncHandler(c.correct),
);
ashaRoutes.post("/me/speech/transcribe", upload.single("audio"), asyncHandler(c.speech));
