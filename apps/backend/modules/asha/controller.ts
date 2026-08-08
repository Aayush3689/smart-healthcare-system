import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import type { AshaService } from "./service.js";
export class AshaController {
  public constructor(private readonly service: AshaService) {}
  private id(r: AuthRequest) {
    if (!r.auth) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
    return r.auth.userId;
  }
  public profile = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.profile(this.id(r)),
      "ASHA profile fetched successfully.",
    );
  public update = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.updateProfile(this.id(r), r.body),
      "ASHA profile updated successfully.",
    );
  public dashboard = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.dashboard(this.id(r)),
      "ASHA dashboard fetched successfully.",
    );
  public statistics = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.statistics(
        this.id(r),
        r.query.from as unknown as Date,
        r.query.to as unknown as Date,
      ),
      "ASHA statistics fetched successfully.",
    );
  public patients = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.listPatients(this.id(r), r.query as never),
      "Patients fetched successfully.",
    );
  public patient = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.patient(this.id(r), r.params.patientId as string),
      "Patient fetched successfully.",
    );
  public createPatient = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      201,
      await this.service.createPatient(this.id(r), r.body),
      "Patient registered successfully.",
    );
  public updatePatient = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.updatePatient(this.id(r), r.params.patientId as string, r.body),
      "Patient updated successfully.",
    );
  public patientAssessments = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      {
        assessments: await this.service.patientAssessments(
          this.id(r),
          r.params.patientId as string,
        ),
      },
      "Patient assessments fetched successfully.",
    );
  public predictions = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      {
        predictions: await this.service.patientPredictions(
          this.id(r),
          r.params.patientId as string,
        ),
      },
      "Patient predictions fetched successfully.",
    );
  public createAssessment = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      201,
      await this.service.createAssessment(this.id(r), r.body),
      "Assessment created successfully.",
    );
  public assessment = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.assessment(this.id(r), r.params.assessmentId as string),
      "Assessment fetched successfully.",
    );
  public assessments = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.listAssessments(this.id(r), r.query as never),
      "Assessments fetched successfully.",
    );
  public createReferral = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      201,
      await this.service.createReferral(this.id(r), r.body),
      "Referral created successfully.",
    );
  public referrals = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.listReferrals(this.id(r), r.query as never),
      "Referrals fetched successfully.",
    );
  public referral = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.referral(this.id(r), r.params.referralId as string),
      "Referral fetched successfully.",
    );
  public followUps = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.followUps(this.id(r), r.query.status as never),
      "Follow-ups fetched successfully.",
    );
  public followUp = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.followUp(this.id(r), r.params.followUpId as string),
      "Follow-up fetched successfully.",
    );
  public completeFollowUp = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.completeFollowUp(this.id(r), r.params.followUpId as string, r.body.notes),
      "Follow-up completed successfully.",
    );
  public appointments = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.appointments(this.id(r), r.query.date as unknown as Date),
      "Appointments fetched successfully.",
    );
  public notifications = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.notifications(this.id(r)),
      "Notifications fetched successfully.",
    );
  public read = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.markNotification(this.id(r), r.params.notificationId as string),
      "Notification marked as read.",
    );
  public readAll = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.markAllNotifications(this.id(r)),
      "Notifications marked as read.",
    );
  public documents = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.documents(this.id(r), r.params.patientId as string),
      "Documents fetched successfully.",
    );
  public upload = async (r: AuthRequest, s: Response) => {
    if (!r.file) throw new AppError("file is required.", 400, "FILE_REQUIRED");
    return sendSuccess(
      s,
      201,
      await this.service.uploadDocument(
        this.id(r),
        r.params.patientId as string,
        r.file,
        r.body.assessmentId,
      ),
      "Document uploaded successfully.",
    );
  };
  public startOcr = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      202,
      await this.service.startOcr(this.id(r), r.params.documentId as string),
      "OCR processing started.",
    );
  public ocr = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.ocr(this.id(r), r.params.documentId as string),
      "OCR status fetched successfully.",
    );
  public extraction = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.extraction(this.id(r), r.params.documentId as string),
      "Extraction fetched successfully.",
    );
  public correct = async (r: AuthRequest, s: Response) =>
    sendSuccess(
      s,
      200,
      await this.service.correctExtraction(
        this.id(r),
        r.params.documentId as string,
        r.body.extractedData,
      ),
      "Extraction corrected successfully.",
    );
  public speech = async (_r: AuthRequest, _s: Response) => {
    throw new AppError("Speech provider is not configured.", 503, "SPEECH_PROVIDER_UNAVAILABLE");
  };
}
