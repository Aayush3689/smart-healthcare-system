import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { AppointmentService } from "./service.js";
import type {
  AppointmentListQuery,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
} from "./validation.js";

export class AppointmentController {
  public constructor(private readonly service: AppointmentService) {}

  public create = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      201,
      await this.service.create(this.userId(request), request.body as CreateAppointmentInput),
      "Appointment created successfully.",
    );

  public get = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.get(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
      ),
      "Appointment fetched successfully.",
    );

  public list = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.list(
        this.userId(request),
        this.role(request),
        request.query as unknown as AppointmentListQuery,
      ),
      "Appointments fetched successfully.",
    );

  public patient = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.patientAppointments(
        this.userId(request),
        this.role(request),
        request.params.patientId as string,
        request.query as unknown as AppointmentListQuery,
      ),
      "Patient appointments fetched successfully.",
    );

  public history = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.history(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
      ),
      "Appointment history fetched successfully.",
    );

  public confirm = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.confirm(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
      ),
      "Appointment confirmed successfully.",
    );

  public start = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.start(this.userId(request), request.params.appointmentId as string),
      "Appointment started successfully.",
    );

  public complete = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.complete(this.userId(request), request.params.appointmentId as string),
      "Appointment completed successfully.",
    );

  public cancel = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.cancel(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
        request.body.reason as string,
      ),
      "Appointment cancelled successfully.",
    );

  public reschedule = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.reschedule(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
        request.body as RescheduleAppointmentInput,
      ),
      "Appointment rescheduled successfully.",
    );

  public noShow = async (request: AuthRequest, response: Response) =>
    sendSuccess(
      response,
      200,
      await this.service.noShow(
        this.userId(request),
        this.role(request),
        request.params.appointmentId as string,
      ),
      "Appointment marked as no-show.",
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
