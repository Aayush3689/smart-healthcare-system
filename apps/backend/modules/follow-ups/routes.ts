import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  followUpController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  completeFollowUpValidation,
  createFollowUpValidation,
  emptyFollowUpActionValidation,
  followUpIdParamValidation,
  followUpListQueryValidation,
  followUpPatientParamValidation,
  missFollowUpValidation,
  rescheduleFollowUpValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
const id = validationMiddleware.validateParams(followUpIdParamValidation);

export const followUpRoutes = Router();
protect(followUpRoutes);
followUpRoutes.post(
  "/",
  authMiddleware.allowRoles("DOCTOR", "PHC_ADMIN"),
  validationMiddleware.validate(createFollowUpValidation),
  asyncHandler(followUpController.create),
);
followUpRoutes.get(
  "/:followUpId",
  authMiddleware.allowRoles("DOCTOR", "PHC_ADMIN", "ASHA_WORKER"),
  id,
  asyncHandler(followUpController.get),
);
followUpRoutes.get(
  "/:followUpId/history",
  authMiddleware.allowRoles("DOCTOR", "PHC_ADMIN", "ASHA_WORKER"),
  id,
  asyncHandler(followUpController.history),
);
followUpRoutes.patch(
  "/:followUpId/reschedule",
  authMiddleware.allowRoles("DOCTOR", "PHC_ADMIN"),
  id,
  validationMiddleware.validate(rescheduleFollowUpValidation),
  asyncHandler(followUpController.reschedule),
);

export const ashaFollowUpRoutes = Router();
protect(ashaFollowUpRoutes);
ashaFollowUpRoutes.use(authMiddleware.allowRoles("ASHA_WORKER"));
ashaFollowUpRoutes.get(
  "/",
  validationMiddleware.validateQuery(followUpListQueryValidation),
  asyncHandler(followUpController.ashaList),
);
ashaFollowUpRoutes.patch(
  "/:followUpId/start",
  id,
  validationMiddleware.validate(emptyFollowUpActionValidation),
  asyncHandler(followUpController.start),
);
ashaFollowUpRoutes.post(
  "/:followUpId/complete",
  id,
  validationMiddleware.validate(completeFollowUpValidation),
  asyncHandler(followUpController.complete),
);
ashaFollowUpRoutes.patch(
  "/:followUpId/missed",
  id,
  validationMiddleware.validate(missFollowUpValidation),
  asyncHandler(followUpController.missed),
);

export const ashaPatientFollowUpRoutes = Router();
protect(ashaPatientFollowUpRoutes);
ashaPatientFollowUpRoutes.use(authMiddleware.allowRoles("ASHA_WORKER"));
ashaPatientFollowUpRoutes.get(
  "/:patientId/follow-ups",
  validationMiddleware.validateParams(followUpPatientParamValidation),
  validationMiddleware.validateQuery(followUpListQueryValidation),
  asyncHandler(followUpController.ashaPatient),
);

export const doctorFollowUpRoutes = Router();
protect(doctorFollowUpRoutes);
doctorFollowUpRoutes.use(authMiddleware.allowRoles("DOCTOR"));
doctorFollowUpRoutes.get(
  "/",
  validationMiddleware.validateQuery(followUpListQueryValidation),
  asyncHandler(followUpController.doctorList),
);
doctorFollowUpRoutes.get("/:followUpId", id, asyncHandler(followUpController.get));

export const phcFollowUpRoutes = Router();
protect(phcFollowUpRoutes);
phcFollowUpRoutes.use(authMiddleware.allowRoles("PHC_ADMIN"));
phcFollowUpRoutes.get(
  "/",
  validationMiddleware.validateQuery(followUpListQueryValidation),
  asyncHandler(followUpController.phcList),
);
