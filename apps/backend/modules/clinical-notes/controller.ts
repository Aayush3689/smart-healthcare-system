import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { ClinicalNoteService } from "./service.js";
import type {
  ClinicalNoteListQuery,
  CreateClinicalNoteInput,
  UpdateClinicalNoteInput,
} from "./validation.js";

export class ClinicalNoteController {
  public constructor(private readonly service: ClinicalNoteService) {}

  public create = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      201,
      await this.service.create(this.userId(req), req.body as CreateClinicalNoteInput),
      "Clinical note created successfully.",
    );
  public get = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.get(this.userId(req), req.params.clinicalNoteId as string),
      "Clinical note fetched successfully.",
    );
  public update = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.update(
        this.userId(req),
        req.params.clinicalNoteId as string,
        req.body as UpdateClinicalNoteInput,
      ),
      "Clinical note updated successfully.",
    );
  public finalize = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.finalize(this.userId(req), req.params.clinicalNoteId as string),
      "Clinical note finalized successfully.",
    );
  public patientNotes = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.patientNotes(
        this.userId(req),
        req.params.patientId as string,
        req.query as unknown as ClinicalNoteListQuery,
      ),
      "Clinical notes fetched successfully.",
    );
  public myNotes = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.myNotes(this.userId(req), req.query as unknown as ClinicalNoteListQuery),
      "Clinical notes fetched successfully.",
    );
  public clinicalSummary = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.clinicalSummary(this.userId(req), req.params.patientId as string),
      "Patient clinical summary fetched successfully.",
    );

  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.userId;
  }
}
