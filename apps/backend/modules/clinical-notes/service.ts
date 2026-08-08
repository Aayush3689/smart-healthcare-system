import { AppointmentStatus, ClinicalNoteStatus, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { ClinicalNoteDetail, ClinicalNoteRepository } from "./repository.js";
import type {
  ClinicalNoteListQuery,
  CreateClinicalNoteInput,
  UpdateClinicalNoteInput,
} from "./validation.js";

export class ClinicalNoteService {
  public constructor(
    private readonly repository: ClinicalNoteRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, input: CreateClinicalNoteInput) {
    const doctor = await this.access.requireDoctor(userId);
    const appointment = await this.repository.appointment(input.appointmentId);
    if (!appointment || appointment.patientId !== input.patientId) {
      throw new AppError("Appointment not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (appointment.doctorId !== doctor.id) throw this.access.forbidden();
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new AppError(
        "Clinical notes can be created only during an appointment in progress.",
        409,
        "INVALID_APPOINTMENT_STATE",
      );
    }
    if (appointment.clinicalNotes.length) {
      throw new AppError(
        "A clinical note already exists for this appointment.",
        409,
        "CLINICAL_NOTE_ALREADY_EXISTS",
      );
    }
    return this.map(await this.repository.create(input, doctor.id, userId));
  }

  public async get(userId: string, id: string) {
    const doctor = await this.access.requireDoctor(userId);
    const note = await this.repository.find(id, this.doctorScope(doctor.id));
    if (!note) throw new AppError("Clinical note not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(note);
  }

  public async update(userId: string, id: string, input: UpdateClinicalNoteInput) {
    const doctor = await this.access.requireDoctor(userId);
    const note = await this.repository.find(id, { doctorId: doctor.id });
    if (!note) throw new AppError("Clinical note not found.", 404, "RESOURCE_NOT_FOUND");
    this.requireDraft(note.status);
    return this.map(await this.repository.update(id, input, userId));
  }

  public async finalize(userId: string, id: string) {
    const doctor = await this.access.requireDoctor(userId);
    const note = await this.repository.find(id, { doctorId: doctor.id });
    if (!note) throw new AppError("Clinical note not found.", 404, "RESOURCE_NOT_FOUND");
    this.requireDraft(note.status);
    if (!note.clinicalImpression || !note.diagnosis || !note.treatmentPlan) {
      throw new AppError(
        "Clinical impression, diagnosis, and treatment plan are required before finalization.",
        422,
        "INCOMPLETE_CLINICAL_NOTE",
      );
    }
    return this.map(await this.repository.finalize(id, userId));
  }

  public async patientNotes(userId: string, patientId: string, query: ClinicalNoteListQuery) {
    const doctor = await this.access.requireDoctor(userId);
    if (!(await this.repository.patientForDoctor(doctor.id, patientId))) {
      throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    }
    return this.list({ patientId }, query);
  }

  public async myNotes(userId: string, query: ClinicalNoteListQuery) {
    const doctor = await this.access.requireDoctor(userId);
    return this.list({ doctorId: doctor.id, patientId: query.patientId }, query);
  }

  public async clinicalSummary(userId: string, patientId: string) {
    const asha = await this.access.requireAsha(userId);
    const note = await this.repository.clinicalSummary(patientId, asha.id);
    if (!note) throw new AppError("Clinical summary not found.", 404, "RESOURCE_NOT_FOUND");
    const followUpDate =
      note.followUpRequired && note.followUpAfterDays && note.finalizedAt
        ? new Date(note.finalizedAt.getTime() + note.followUpAfterDays * 86_400_000)
        : null;
    return {
      diagnosis: note.diagnosis,
      followUpRequired: note.followUpRequired,
      followUpDate,
      instructions: note.advice,
    };
  }

  private async list(scope: Prisma.ClinicalNoteWhereInput, query: ClinicalNoteListQuery) {
    const date = query.from || query.to ? { gte: query.from, lte: query.to } : undefined;
    const [items, total] = await this.repository.list(
      { ...scope, status: query.status, createdAt: date },
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((note) => this.map(note)),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  private doctorScope(doctorId: string): Prisma.ClinicalNoteWhereInput {
    return {
      OR: [
        { doctorId },
        { patient: { appointments: { some: { doctorId } } } },
        { patient: { referrals: { some: { doctorAssignments: { some: { doctorId } } } } } },
      ],
    };
  }

  private requireDraft(status: ClinicalNoteStatus): void {
    if (status !== ClinicalNoteStatus.DRAFT) {
      throw new AppError("Final clinical notes cannot be modified.", 409, "CLINICAL_NOTE_FINAL");
    }
  }

  private map(note: ClinicalNoteDetail) {
    return {
      id: note.id,
      appointmentId: note.appointmentId,
      patientId: note.patientId,
      patient: {
        id: note.patient.id,
        fullName: note.patient.fullName,
        age: this.age(note.patient.dateOfBirth),
      },
      doctorId: note.doctorId,
      doctor: { id: note.doctor.id, fullName: note.doctor.fullName },
      observations: note.observations,
      clinicalImpression: note.clinicalImpression,
      diagnosis: note.diagnosis,
      treatmentPlan: note.treatmentPlan,
      advice: note.advice,
      medications: note.medications,
      followUpRequired: note.followUpRequired,
      followUpAfterDays: note.followUpAfterDays,
      status: note.status,
      finalizedAt: note.finalizedAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  private age(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    if (
      now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
      (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
        now.getUTCDate() < dateOfBirth.getUTCDate())
    )
      age--;
    return age;
  }
}
