import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import type { DoctorService } from "./service.js";
import type {
  CreateDoctorInput,
  DoctorListQuery,
  DoctorPatientListQuery,
  UpdateAvailabilityInput,
  UpdateDoctorInput,
} from "./validation.js";

export class DoctorController {
  public constructor(private readonly service: DoctorService) {}

  public list = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.list(this.userId(req), req.query as unknown as DoctorListQuery),
      "Doctors fetched successfully.",
    );
  public create = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      201,
      await this.service.create(this.userId(req), req.body as CreateDoctorInput),
      "Doctor created successfully.",
    );
  public get = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.get(this.userId(req), req.params.doctorId as string),
      "Doctor fetched successfully.",
    );
  public me = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.me(this.userId(req)),
      "Doctor profile fetched successfully.",
    );
  public update = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.update(
        this.userId(req),
        req.params.doctorId as string,
        req.body as UpdateDoctorInput,
      ),
      "Doctor updated successfully.",
    );
  public updateMe = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.updateMe(this.userId(req), req.body as UpdateDoctorInput),
      "Doctor profile updated successfully.",
    );
  public activate = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.activate(this.userId(req), req.params.doctorId as string),
      "Doctor activated successfully.",
    );
  public deactivate = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.deactivate(this.userId(req), req.params.doctorId as string),
      "Doctor deactivated successfully.",
    );
  public availability = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.availability(this.userId(req)),
      "Doctor availability fetched successfully.",
    );
  public adminAvailability = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.adminAvailability(this.userId(req), req.params.doctorId as string),
      "Doctor availability fetched successfully.",
    );
  public updateAvailability = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.updateAvailability(this.userId(req), req.body as UpdateAvailabilityInput),
      "Doctor availability updated successfully.",
    );
  public summary = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.summary(this.userId(req)),
      "Doctor summary fetched successfully.",
    );
  public patients = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.patients(this.userId(req), req.query as unknown as DoctorPatientListQuery),
      "Doctor patients fetched successfully.",
    );
  public patient = async (req: AuthRequest, res: Response) =>
    sendSuccess(
      res,
      200,
      await this.service.patient(this.userId(req), req.params.patientId as string),
      "Doctor patient fetched successfully.",
    );

  private userId(request: AuthRequest): string {
    if (!request.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return request.auth.userId;
  }
}
