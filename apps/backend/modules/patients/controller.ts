import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { PatientService } from "./service.js";
import type { PatientListQuery, PatientTimelineQuery } from "./validation.js";

export class PatientController {
  public constructor(private readonly service: PatientService) {}

  public create = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      201,
      await this.service.create(this.userId(request), request.body),
      "Patient created successfully.",
    );

  public list = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.list(
        this.userId(request),
        this.role(request),
        request.query as unknown as PatientListQuery,
      ),
      "Patients fetched successfully.",
    );

  public get = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.get(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
      ),
      "Patient fetched successfully.",
    );

  public update = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.update(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
        request.body,
      ),
      "Patient updated successfully.",
    );

  public summary = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.summary(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
      ),
      "Patient summary fetched successfully.",
    );

  public timeline = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.timeline(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
        request.query as unknown as PatientTimelineQuery,
      ),
      "Patient timeline fetched successfully.",
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
