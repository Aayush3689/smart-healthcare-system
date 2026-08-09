import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { FollowUpService } from "./service.js";
import type {
  CompleteFollowUpInput,
  CreateFollowUpInput,
  FollowUpListQuery,
  RescheduleFollowUpInput,
} from "./validation.js";

export class FollowUpController {
  public constructor(private readonly service: FollowUpService) {}

  public create = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      201,
      await this.service.create(this.userId(req), this.role(req), req.body as CreateFollowUpInput),
      "Follow-up created successfully.",
    );
  public get = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.get(this.userId(req), this.role(req), req.params.followUpId as string),
      "Follow-up fetched successfully.",
    );
  public history = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.history(this.userId(req), this.role(req), req.params.followUpId as string),
      "Follow-up history fetched successfully.",
    );
  public reschedule = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.reschedule(
        this.userId(req),
        this.role(req),
        req.params.followUpId as string,
        req.body as RescheduleFollowUpInput,
      ),
      "Follow-up rescheduled successfully.",
    );
  public ashaList = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.ashaList(this.userId(req), req.query as unknown as FollowUpListQuery),
      "Follow-ups fetched successfully.",
    );
  public ashaPatient = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.ashaList(
        this.userId(req),
        req.query as unknown as FollowUpListQuery,
        req.params.patientId as string,
      ),
      "Patient follow-ups fetched successfully.",
    );
  public doctorList = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.doctorList(this.userId(req), req.query as unknown as FollowUpListQuery),
      "Follow-ups fetched successfully.",
    );
  public phcList = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.phcList(this.userId(req), req.query as unknown as FollowUpListQuery),
      "Follow-ups fetched successfully.",
    );
  public start = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.start(this.userId(req), req.params.followUpId as string),
      "Follow-up started successfully.",
    );
  public complete = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.complete(
        this.userId(req),
        req.params.followUpId as string,
        req.body as CompleteFollowUpInput,
      ),
      "Follow-up completed successfully.",
    );
  public missed = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.missed(
        this.userId(req),
        req.params.followUpId as string,
        req.body.reason as string,
      ),
      "Follow-up marked as missed.",
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
