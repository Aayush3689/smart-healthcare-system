import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { VillageService } from "./service.js";
import type {
  VillageDiseaseStatisticsQuery,
  VillageFollowUpQuery,
  VillageHighRiskQuery,
  VillageListQuery,
  VillagePatientQuery,
  VillageReferralQuery,
} from "./validation.js";

export class VillageController {
  public constructor(private readonly service: VillageService) {}

  public get = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.get(this.userId(req), this.role(req), req.params.villageId as string),
      "Village fetched successfully.",
    );
  public myAshaVillage = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.myAshaVillage(this.userId(req)),
      "Village fetched successfully.",
    );
  public phcVillages = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.phcVillages(this.userId(req), req.query as unknown as VillageListQuery),
      "Villages fetched successfully.",
    );
  public phcVillage = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.phcVillage(this.userId(req), req.params.villageId as string),
      "Village fetched successfully.",
    );
  public ashaWorkers = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.ashaWorkers(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
      ),
      "Village ASHA workers fetched successfully.",
    );
  public patients = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.patients(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
        req.query as unknown as VillagePatientQuery,
      ),
      "Village patients fetched successfully.",
    );
  public statistics = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.statistics(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
      ),
      "Village statistics fetched successfully.",
    );
  public diseaseStatistics = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.diseaseStatistics(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
        req.query as unknown as VillageDiseaseStatisticsQuery,
      ),
      "Village disease statistics fetched successfully.",
    );
  public highRisk = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.highRisk(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
        req.query as unknown as VillageHighRiskQuery,
      ),
      "High-risk patients fetched successfully.",
    );
  public referrals = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.referrals(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
        req.query as unknown as VillageReferralQuery,
      ),
      "Village referrals fetched successfully.",
    );
  public followUps = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.followUps(
        this.userId(req),
        this.role(req),
        req.params.villageId as string,
        req.query as unknown as VillageFollowUpQuery,
      ),
      "Village follow-ups fetched successfully.",
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
