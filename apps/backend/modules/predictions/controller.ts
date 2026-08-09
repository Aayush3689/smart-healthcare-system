import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { PredictionService } from "./service.js";
import type {
  CreatePredictionInput,
  HighRiskPredictionQuery,
  PatientPredictionQuery,
  PredictionStatisticsQuery,
} from "./validation.js";

export class PredictionController {
  public constructor(private readonly service: PredictionService) {}

  public create = async (request: AuthRequest, response: Response) => {
    const result = await this.service.create(
      this.userId(request),
      request.body as CreatePredictionInput,
    );
    return sendSuccess(
      response,
      result.alreadyExists ? 200 : 201,
      result.prediction,
      result.alreadyExists
        ? "Prediction already synchronized."
        : "Prediction created successfully.",
    );
  };

  public bulk = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.createBulk(
        this.userId(request),
        (request.body as { predictions: CreatePredictionInput[] }).predictions,
      ),
      "Predictions synchronized successfully.",
    );

  public get = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.get(
        this.userId(request),
        this.role(request),
        request.params.predictionId as string,
      ),
      "Prediction fetched successfully.",
    );

  public assessment = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.byAssessment(
        this.userId(request),
        this.role(request),
        request.params.assessmentId as string,
      ),
      "Assessment predictions fetched successfully.",
    );

  public patient = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.byPatient(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
        request.query as unknown as PatientPredictionQuery,
      ),
      "Patient predictions fetched successfully.",
    );

  public highRisk = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.highRisk(
        this.userId(request),
        this.role(request),
        request.query as unknown as HighRiskPredictionQuery,
      ),
      "High-risk predictions fetched successfully.",
    );

  public statistics = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.statistics(
        this.userId(request),
        this.role(request),
        request.query as unknown as PredictionStatisticsQuery,
      ),
      "Prediction statistics fetched successfully.",
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
