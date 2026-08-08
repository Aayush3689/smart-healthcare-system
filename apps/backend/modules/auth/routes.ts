import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import type { AuthMiddleware } from "../../middleware/auth.middleware.js";
import { validationMiddleware } from "../../middleware/validate.middleware.js";
import type { AuthController } from "./controller.js";
import {
  provisionAccountValidation,
  refreshTokenValidation,
  requestOtpValidation,
  updateLoginDetailsValidation,
  verifyOtpValidation,
} from "./validation.js";

export class AuthRoutes {
  public readonly router = Router();
  public constructor(
    private readonly controller: AuthController,
    private readonly middleware: AuthMiddleware,
  ) {
    this.router.post(
      "/request-otp",
      validationMiddleware.validate(requestOtpValidation),
      asyncHandler(this.controller.requestOtp),
    );
    this.router.post(
      "/verify-otp",
      validationMiddleware.validate(verifyOtpValidation),
      asyncHandler(this.controller.verifyOtp),
    );
    this.router.post(
      "/refresh",
      validationMiddleware.validate(refreshTokenValidation),
      asyncHandler(this.controller.refresh),
    );
    this.router.post(
      "/logout",
      validationMiddleware.validate(refreshTokenValidation),
      asyncHandler(this.controller.logout),
    );
    this.router.get("/me", this.middleware.authenticate, asyncHandler(this.controller.me));
    this.router.patch(
      "/me/login-details",
      this.middleware.authenticate,
      validationMiddleware.validate(updateLoginDetailsValidation),
      asyncHandler(this.controller.changeLoginDetails),
    );
    this.router.post(
      "/accounts",
      this.middleware.authenticate,
      this.middleware.allowRoles("PHC_ADMIN"),
      validationMiddleware.validate(provisionAccountValidation),
      asyncHandler(this.controller.provisionAccount),
    );
  }
}
