import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type { PhcDashboardService } from "./service.js";

export class PhcDashboardController {
  public constructor(private readonly service: PhcDashboardService) {}

  dashboard = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.dashboard(this.id(request)),
      "PHC dashboard fetched successfully.",
    );
  referrals = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.referrals(this.id(request), request.query as never),
      "PHC referrals fetched successfully.",
    );
  highRiskPatients = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.highRiskPatients(this.id(request), request.query as never),
      "PHC high-risk patients fetched successfully.",
    );
  appointments = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.appointments(this.id(request), request.query as never),
      "PHC appointments fetched successfully.",
    );
  followUps = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.followUps(this.id(request), request.query as never),
      "PHC follow-ups fetched successfully.",
    );
  villages = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.villages(this.id(request), request.query as never),
      "PHC village dashboard fetched successfully.",
    );
  doctors = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.doctors(this.id(request), request.query as never),
      "PHC doctor workload fetched successfully.",
    );
  ashaWorkers = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.ashaWorkers(this.id(request), request.query as never),
      "PHC ASHA worker dashboard fetched successfully.",
    );
  trends = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.trends(this.id(request), request.query as never),
      "PHC dashboard trends fetched successfully.",
    );

  private id(request: AuthRequest) {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHORIZED");
    return request.auth.userId;
  }
}
