import { Router } from "express";
import {
  activeAccountMiddleware,
  appointmentController,
  authMiddleware,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  appointmentIdParamValidation,
  appointmentListQueryValidation,
  cancelAppointmentValidation,
  createAppointmentValidation,
  emptyAppointmentActionValidation,
  rescheduleAppointmentValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
const id = validationMiddleware.validateParams(appointmentIdParamValidation);

export const appointmentRoutes = Router();
protect(appointmentRoutes);
appointmentRoutes.post(
  "/",
  authMiddleware.allowRoles("PHC_ADMIN"),
  validationMiddleware.validate(createAppointmentValidation),
  asyncHandler(appointmentController.create),
);
appointmentRoutes.get("/:appointmentId", id, asyncHandler(appointmentController.get));
appointmentRoutes.get("/:appointmentId/history", id, asyncHandler(appointmentController.history));
appointmentRoutes.patch(
  "/:appointmentId/confirm",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  id,
  validationMiddleware.validate(emptyAppointmentActionValidation),
  asyncHandler(appointmentController.confirm),
);
appointmentRoutes.patch(
  "/:appointmentId/cancel",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR", "ASHA_WORKER"),
  id,
  validationMiddleware.validate(cancelAppointmentValidation),
  asyncHandler(appointmentController.cancel),
);
appointmentRoutes.patch(
  "/:appointmentId/reschedule",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  id,
  validationMiddleware.validate(rescheduleAppointmentValidation),
  asyncHandler(appointmentController.reschedule),
);
appointmentRoutes.patch(
  "/:appointmentId/no-show",
  authMiddleware.allowRoles("PHC_ADMIN", "DOCTOR"),
  id,
  validationMiddleware.validate(emptyAppointmentActionValidation),
  asyncHandler(appointmentController.noShow),
);

export const phcAppointmentRoutes = Router();
protect(phcAppointmentRoutes);
phcAppointmentRoutes.use(authMiddleware.allowRoles("PHC_ADMIN"));
phcAppointmentRoutes.get(
  "/",
  validationMiddleware.validateQuery(appointmentListQueryValidation),
  asyncHandler(appointmentController.list),
);

export const doctorAppointmentRoutes = Router();
protect(doctorAppointmentRoutes);
doctorAppointmentRoutes.use(authMiddleware.allowRoles("DOCTOR"));
doctorAppointmentRoutes.get(
  "/",
  validationMiddleware.validateQuery(appointmentListQueryValidation),
  asyncHandler(appointmentController.list),
);
doctorAppointmentRoutes.get("/:appointmentId", id, asyncHandler(appointmentController.get));
doctorAppointmentRoutes.patch(
  "/:appointmentId/start",
  id,
  validationMiddleware.validate(emptyAppointmentActionValidation),
  asyncHandler(appointmentController.start),
);
doctorAppointmentRoutes.patch(
  "/:appointmentId/complete",
  id,
  validationMiddleware.validate(emptyAppointmentActionValidation),
  asyncHandler(appointmentController.complete),
);
