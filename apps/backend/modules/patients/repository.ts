import type { Prisma, PrismaClient } from "@prisma/client";
export class PatientRepository {
  public constructor(private readonly db: PrismaClient) {}
  find(id: string) {
    return this.db.patient.findUnique({
      where: { id },
      include: { village: true, registeredBy: true },
    });
  }
  village(id: string) {
    return this.db.village.findUnique({ where: { id } });
  }
  create(data: Prisma.PatientUncheckedCreateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const p = await tx.patient.create({ data });
      await tx.auditLog.create({
        data: { userId, action: "PATIENT_CREATED", entityType: "PATIENT", entityId: p.id },
      });
      return p;
    });
  }
  update(id: string, data: Prisma.PatientUncheckedUpdateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const p = await tx.patient.update({ where: { id }, data });
      await tx.auditLog.create({
        data: { userId, action: "PATIENT_UPDATED", entityType: "PATIENT", entityId: id },
      });
      return p;
    });
  }
  history(id: string, type: string) {
    if (type === "assessments")
      return this.db.assessment.findMany({
        where: { patientId: id },
        include: { predictions: { include: { reasons: true, modelVersion: true } } },
        orderBy: { createdAt: "desc" },
      });
    return this.db.prediction.findMany({
      where: { assessment: { patientId: id } },
      include: { reasons: true, modelVersion: true },
      orderBy: { generatedAt: "desc" },
    });
  }
}
