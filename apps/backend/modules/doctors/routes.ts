import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  doctorController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  createDoctorValidation,
  doctorIdParamValidation,
  doctorListQueryValidation,
  doctorPatientListQueryValidation,
  doctorPatientParamValidation,
  emptyDoctorActionValidation,
  updateAvailabilityValidation,
  updateDoctorValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);

export const doctorRoutes = Router();
protect(doctorRoutes);
doctorRoutes.use(authMiddleware.allowRoles("DOCTOR"));
doctorRoutes.get("/me", asyncHandler(doctorController.me));
doctorRoutes.patch(
  "/me",
  validationMiddleware.validate(updateDoctorValidation),
  asyncHandler(doctorController.updateMe),
);
doctorRoutes.get("/me/availability", asyncHandler(doctorController.availability));
doctorRoutes.patch(
  "/me/availability",
  validationMiddleware.validate(updateAvailabilityValidation),
  asyncHandler(doctorController.updateAvailability),
);
doctorRoutes.get("/me/summary", asyncHandler(doctorController.summary));
doctorRoutes.get(
  "/me/patients",
  validationMiddleware.validateQuery(doctorPatientListQueryValidation),
  asyncHandler(doctorController.patients),
);
doctorRoutes.get(
  "/me/patients/:patientId",
  validationMiddleware.validateParams(doctorPatientParamValidation),
  asyncHandler(doctorController.patient),
);

export const phcDoctorRoutes = Router();
protect(phcDoctorRoutes);
phcDoctorRoutes.use(authMiddleware.allowRoles("PHC_ADMIN"));
phcDoctorRoutes.get(
  "/",
  validationMiddleware.validateQuery(doctorListQueryValidation),
  asyncHandler(doctorController.list),
);
phcDoctorRoutes.post(
  "/",
  validationMiddleware.validate(createDoctorValidation),
  asyncHandler(doctorController.create),
);
phcDoctorRoutes.get(
  "/:doctorId",
  validationMiddleware.validateParams(doctorIdParamValidation),
  asyncHandler(doctorController.get),
);
phcDoctorRoutes.patch(
  "/:doctorId",
  validationMiddleware.validateParams(doctorIdParamValidation),
  validationMiddleware.validate(updateDoctorValidation),
  asyncHandler(doctorController.update),
);
phcDoctorRoutes.patch(
  "/:doctorId/activate",
  validationMiddleware.validateParams(doctorIdParamValidation),
  validationMiddleware.validate(emptyDoctorActionValidation),
  asyncHandler(doctorController.activate),
);
phcDoctorRoutes.patch(
  "/:doctorId/deactivate",
  validationMiddleware.validateParams(doctorIdParamValidation),
  validationMiddleware.validate(emptyDoctorActionValidation),
  asyncHandler(doctorController.deactivate),
);
phcDoctorRoutes.get(
  "/:doctorId/availability",
  validationMiddleware.validateParams(doctorIdParamValidation),
  asyncHandler(doctorController.adminAvailability),
);
