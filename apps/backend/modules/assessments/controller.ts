import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { AssessmentService } from "./service.js";
import type {
  AssessmentListQuery,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from "./validation.js";

export class AssessmentController {
  public constructor(private readonly service: AssessmentService) {}

  public create = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      201,
      await this.service.createDraft(this.userId(request), request.body as CreateAssessmentInput),
      "Assessment created successfully.",
    );

  public list = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.list(
        this.userId(request),
        this.role(request),
        request.query as unknown as AssessmentListQuery,
      ),
      "Assessments fetched successfully.",
    );

  public get = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.get(
        this.userId(request),
        this.role(request),
        request.params.assessmentId as string,
      ),
      "Assessment fetched successfully.",
    );

  public update = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.update(
        this.userId(request),
        request.params.assessmentId as string,
        request.body as UpdateAssessmentInput,
      ),
      "Assessment updated successfully.",
    );

  public complete = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.complete(this.userId(request), request.params.assessmentId as string),
      "Assessment completed successfully.",
    );

  public predictions = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.predictionList(
        this.userId(request),
        this.role(request),
        request.params.assessmentId as string,
      ),
      "Assessment predictions fetched successfully.",
    );

  public documents = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.documentList(
        this.userId(request),
        this.role(request),
        request.params.assessmentId as string,
      ),
      "Assessment documents fetched successfully.",
    );

  public patientHistory = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      {
        assessments: await this.service.history(
          this.userId(request),
          this.role(request),
          request.params.patientId as string,
        ),
      },
      "Assessment history fetched successfully.",
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
