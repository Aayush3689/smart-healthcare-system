import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  phcDashboardController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  appointmentDashboardQueryValidation,
  ashaDashboardQueryValidation,
  dashboardQueryValidation,
  doctorDashboardQueryValidation,
  followUpDashboardQueryValidation,
  highRiskDashboardQueryValidation,
  referralDashboardQueryValidation,
  trendDashboardQueryValidation,
  villageDashboardQueryValidation,
} from "./validation.js";

export const phcDashboardRoutes = Router();
phcDashboardRoutes.use(
  authMiddleware.authenticate,
  activeAccountMiddleware.verify,
  authMiddleware.allowRoles("PHC_ADMIN"),
);
phcDashboardRoutes.get(
  "/",
  validationMiddleware.validateQuery(dashboardQueryValidation),
  asyncHandler(phcDashboardController.dashboard),
);
phcDashboardRoutes.get(
  "/referrals",
  validationMiddleware.validateQuery(referralDashboardQueryValidation),
  asyncHandler(phcDashboardController.referrals),
);
phcDashboardRoutes.get(
  "/high-risk-patients",
  validationMiddleware.validateQuery(highRiskDashboardQueryValidation),
  asyncHandler(phcDashboardController.highRiskPatients),
);
phcDashboardRoutes.get(
  "/appointments",
  validationMiddleware.validateQuery(appointmentDashboardQueryValidation),
  asyncHandler(phcDashboardController.appointments),
);
phcDashboardRoutes.get(
  "/follow-ups",
  validationMiddleware.validateQuery(followUpDashboardQueryValidation),
  asyncHandler(phcDashboardController.followUps),
);
phcDashboardRoutes.get(
  "/villages",
  validationMiddleware.validateQuery(villageDashboardQueryValidation),
  asyncHandler(phcDashboardController.villages),
);
phcDashboardRoutes.get(
  "/doctors",
  validationMiddleware.validateQuery(doctorDashboardQueryValidation),
  asyncHandler(phcDashboardController.doctors),
);
phcDashboardRoutes.get(
  "/asha-workers",
  validationMiddleware.validateQuery(ashaDashboardQueryValidation),
  asyncHandler(phcDashboardController.ashaWorkers),
);
phcDashboardRoutes.get(
  "/trends",
  validationMiddleware.validateQuery(trendDashboardQueryValidation),
  asyncHandler(phcDashboardController.trends),
);
