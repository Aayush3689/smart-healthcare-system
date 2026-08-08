import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { ReferralService } from "./service.js";
import type { CreateReferralInput, ReferralListQuery } from "./validation.js";

export class ReferralController {
  public constructor(private readonly service: ReferralService) {}

  public create = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      201,
      await this.service.create(this.userId(request), request.body as CreateReferralInput),
      "Referral created successfully.",
    );

  public get = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.get(
        this.userId(request),
        this.role(request),
        request.params.referralId as string,
      ),
      "Referral fetched successfully.",
    );

  public list = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.list(
        this.userId(request),
        this.role(request),
        request.query as unknown as ReferralListQuery,
      ),
      "Referrals fetched successfully.",
    );

  public patient = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.patientReferrals(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
        request.query as unknown as ReferralListQuery,
      ),
      "Patient referrals fetched successfully.",
    );

  public history = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.history(
        this.userId(request),
        this.role(request),
        request.params.referralId as string,
      ),
      "Referral history fetched successfully.",
    );

  public accept = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.accept(this.userId(request), request.params.referralId as string),
      "Referral accepted successfully.",
    );

  public reject = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.reject(
        this.userId(request),
        request.params.referralId as string,
        request.body.reason as string,
      ),
      "Referral rejected successfully.",
    );

  public assignDoctor = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.assignDoctor(
        this.userId(request),
        request.params.referralId as string,
        request.body,
      ),
      "Doctor assigned successfully.",
    );

  public start = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.start(this.userId(request), request.params.referralId as string),
      "Referral marked as in progress.",
    );

  public complete = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.complete(
        this.userId(request),
        request.params.referralId as string,
        request.body.notes as string,
      ),
      "Referral completed successfully.",
    );

  public cancel = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.cancel(
        this.userId(request),
        this.role(request),
        request.params.referralId as string,
        request.body.reason as string,
      ),
      "Referral cancelled successfully.",
    );

  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.userId;
  }

  private role(request: AuthRequest) {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.role;
  }
}
