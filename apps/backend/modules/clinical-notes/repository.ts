import { ClinicalNoteStatus, type Prisma, type PrismaClient } from "@prisma/client";
import type { CreateClinicalNoteInput, UpdateClinicalNoteInput } from "./validation.js";

const include = {
  patient: { include: { village: true } },
  doctor: true,
  appointment: true,
  medications: true,
} satisfies Prisma.ClinicalNoteInclude;

export type ClinicalNoteDetail = Prisma.ClinicalNoteGetPayload<{ include: typeof include }>;

export class ClinicalNoteRepository {
  public constructor(private readonly db: PrismaClient) {}

  public appointment(id: string) {
    return this.db.appointment.findUnique({
      where: { id },
      include: { clinicalNotes: { select: { id: true } } },
    });
  }

  public create(input: CreateClinicalNoteInput, doctorId: string, userId: string) {
    const { medications, ...note } = input;
    return this.db.$transaction(async (tx) => {
      const created = await tx.clinicalNote.create({
        data: {
          ...note,
          doctorId,
          medications: medications?.length ? { create: medications } : undefined,
        },
        include,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "CLINICAL_NOTE_CREATED",
          entityType: "CLINICAL_NOTE",
          entityId: created.id,
        },
      });
      return created;
    });
  }

  public find(id: string, where?: Prisma.ClinicalNoteWhereInput) {
    return this.db.clinicalNote.findFirst({ where: { id, ...where }, include });
  }

  public update(id: string, input: UpdateClinicalNoteInput, userId: string) {
    const { medications, ...note } = input;
    return this.db.$transaction(async (tx) => {
      if (medications) await tx.clinicalMedication.deleteMany({ where: { clinicalNoteId: id } });
      const updated = await tx.clinicalNote.update({
        where: { id },
        data: {
          ...note,
          medications: medications ? { create: medications } : undefined,
        },
        include,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "CLINICAL_NOTE_UPDATED",
          entityType: "CLINICAL_NOTE",
          entityId: id,
        },
      });
      return updated;
    });
  }

  public finalize(id: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const note = await tx.clinicalNote.update({
        where: { id },
        data: { status: ClinicalNoteStatus.FINAL, finalizedAt: new Date() },
        include,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "CLINICAL_NOTE_FINALIZED",
          entityType: "CLINICAL_NOTE",
          entityId: id,
        },
      });
      return note;
    });
  }

  public async list(where: Prisma.ClinicalNoteWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.clinicalNote.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.db.clinicalNote.count({ where }),
    ]);
  }

  public patientForDoctor(doctorId: string, patientId: string) {
    return this.db.patient.findFirst({
      where: {
        id: patientId,
        OR: [
          { appointments: { some: { doctorId } } },
          { referrals: { some: { doctorAssignments: { some: { doctorId } } } } },
        ],
      },
      select: { id: true },
    });
  }

  public clinicalSummary(patientId: string, ashaId: string) {
    return this.db.clinicalNote.findFirst({
      where: { patientId, patient: { registeredById: ashaId }, status: ClinicalNoteStatus.FINAL },
      select: {
        diagnosis: true,
        advice: true,
        followUpRequired: true,
        followUpAfterDays: true,
        finalizedAt: true,
      },
      orderBy: { finalizedAt: "desc" },
    });
  }
}
