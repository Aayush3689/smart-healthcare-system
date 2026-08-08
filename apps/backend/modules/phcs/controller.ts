import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { PhcService } from "./service.js";
import type { StatisticsQuery, UpdatePhcInput } from "./validation.js";

export class PhcController {
  public constructor(private readonly service: PhcService) {}

  public me = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.me(this.userId(req)),
      "PHC details fetched successfully.",
    );
  public update = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.update(this.userId(req), req.body as UpdatePhcInput),
      "PHC details updated successfully.",
    );
  public villages = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.villages(this.userId(req)),
      "PHC villages fetched successfully.",
    );
  public village = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.village(this.userId(req), req.params.villageId as string),
      "PHC village fetched successfully.",
    );
  public overview = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.overview(this.userId(req)),
      "PHC overview fetched successfully.",
    );
  public statistics = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.statistics(this.userId(req), req.query as unknown as StatisticsQuery),
      "PHC statistics fetched successfully.",
    );
  public diseaseStatistics = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.diseaseStatistics(
        this.userId(req),
        req.query as unknown as StatisticsQuery,
      ),
      "PHC disease statistics fetched successfully.",
    );
  public villageStatistics = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.villageStatistics(this.userId(req)),
      "Village statistics fetched successfully.",
    );
  public ashaWorkers = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.ashaWorkers(this.userId(req)),
      "ASHA workers fetched successfully.",
    );
  public operations = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.operations(this.userId(req)),
      "PHC operations fetched successfully.",
    );

  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.userId;
  }
}
