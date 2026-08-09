import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type {
  ProvisionAccountInput,
  RefreshTokenInput,
  RequestOtpInput,
  UpdateLoginDetailsInput,
  VerifyOtpInput,
} from "./validation.js";
import type { AuthService } from "./service.js";

type BodyRequest<T> = Request<ParamsDictionary, unknown, T>;
type AuthBodyRequest<T> = AuthRequest & { body: T };

export class AuthController {
  public constructor(private readonly service: AuthService) {}
  public requestOtp = async (
    request: BodyRequest<RequestOtpInput>,
    response: Response,
  ): Promise<Response> => {
    await this.service.requestOtp(request.body.email);
    return sendSuccess(
      response,
      200,
      null,
      "If the account is active, a verification code has been sent.",
    );
  };
  public verifyOtp = async (
    request: BodyRequest<VerifyOtpInput>,
    response: Response,
  ): Promise<Response> =>
    sendSuccess(
      response,
      200,
      await this.service.verifyOtp(
        request.body.email,
        request.body.otp,
        request.body.platform ?? "MOBILE_APP",
        request.body.deviceId,
      ),
      "Login successful.",
    );
  public refresh = async (
    request: BodyRequest<RefreshTokenInput>,
    response: Response,
  ): Promise<Response> =>
    sendSuccess(
      response,
      200,
      await this.service.refresh(request.body.refreshToken),
      "Token refreshed.",
    );
  public logout = async (
    request: BodyRequest<RefreshTokenInput>,
    response: Response,
  ): Promise<Response> => {
    await this.service.logout(request.body.refreshToken);
    return sendSuccess(response, 200, null, "Logged out successfully.");
  };
  public me = async (request: AuthRequest, response: Response): Promise<Response> =>
    sendSuccess(response, 200, await this.service.me(this.userId(request)), "Account retrieved.");
  public changeLoginDetails = async (
    request: AuthBodyRequest<UpdateLoginDetailsInput>,
    response: Response,
  ): Promise<Response> =>
    sendSuccess(
      response,
      200,
      await this.service.changeEmail(this.userId(request), request.body.email),
      "Email updated. Verify the new address with an OTP.",
    );
  public provisionAccount = async (
    request: AuthBodyRequest<ProvisionAccountInput>,
    response: Response,
  ): Promise<Response> =>
    sendSuccess(
      response,
      201,
      await this.service.provision(this.userId(request), request.body),
      "Account created.",
    );
  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.userId;
  }
}
