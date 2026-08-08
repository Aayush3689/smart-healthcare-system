import { Router } from "express";
import {
  activeAccountMiddleware,
  authMiddleware,
  referralController,
} from "../../container/index.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import {
  assignDoctorValidation,
  cancelReferralValidation,
  completeReferralValidation,
  createReferralValidation,
  emptyReferralActionValidation,
  referralIdParamValidation,
  referralListQueryValidation,
  rejectReferralValidation,
} from "./validation.js";

const protect = (router: Router) =>
  router.use(authMiddleware.authenticate, activeAccountMiddleware.verify);
const id = validationMiddleware.validateParams(referralIdParamValidation);

export const referralRoutes = Router();
protect(referralRoutes);
referralRoutes.post(
  "/",
  authMiddleware.allowRoles("ASHA_WORKER"),
  validationMiddleware.validate(createReferralValidation),
  asyncHandler(referralController.create),
);
referralRoutes.get("/:referralId", id, asyncHandler(referralController.get));
referralRoutes.get("/:referralId/history", id, asyncHandler(referralController.history));
referralRoutes.patch(
  "/:referralId/cancel",
  authMiddleware.allowRoles("ASHA_WORKER", "PHC_ADMIN"),
  id,
  validationMiddleware.validate(cancelReferralValidation),
  asyncHandler(referralController.cancel),
);

export const phcReferralRoutes = Router();
protect(phcReferralRoutes);
phcReferralRoutes.use(authMiddleware.allowRoles("PHC_ADMIN"));
phcReferralRoutes.get(
  "/",
  validationMiddleware.validateQuery(referralListQueryValidation),
  asyncHandler(referralController.list),
);
phcReferralRoutes.get("/:referralId", id, asyncHandler(referralController.get));
phcReferralRoutes.patch(
  "/:referralId/accept",
  id,
  validationMiddleware.validate(emptyReferralActionValidation),
  asyncHandler(referralController.accept),
);
phcReferralRoutes.patch(
  "/:referralId/reject",
  id,
  validationMiddleware.validate(rejectReferralValidation),
  asyncHandler(referralController.reject),
);
phcReferralRoutes.patch(
  "/:referralId/assign-doctor",
  id,
  validationMiddleware.validate(assignDoctorValidation),
  asyncHandler(referralController.assignDoctor),
);

export const doctorReferralRoutes = Router();
protect(doctorReferralRoutes);
doctorReferralRoutes.use(authMiddleware.allowRoles("DOCTOR"));
doctorReferralRoutes.get(
  "/",
  validationMiddleware.validateQuery(referralListQueryValidation),
  asyncHandler(referralController.list),
);
doctorReferralRoutes.get("/:referralId", id, asyncHandler(referralController.get));
doctorReferralRoutes.patch(
  "/:referralId/start",
  id,
  validationMiddleware.validate(emptyReferralActionValidation),
  asyncHandler(referralController.start),
);
doctorReferralRoutes.patch(
  "/:referralId/complete",
  id,
  validationMiddleware.validate(completeReferralValidation),
  asyncHandler(referralController.complete),
);
