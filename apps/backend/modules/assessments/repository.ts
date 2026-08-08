import type { Prisma, PrismaClient } from "@prisma/client";

const detailInclude = {
  patient: { include: { village: true } },
  conductedBy: { select: { id: true, fullName: true } },
  predictions: { include: { reasons: true, modelVersion: true } },
  documents: true,
} satisfies Prisma.AssessmentInclude;

export class AssessmentRepository {
  public constructor(private readonly db: PrismaClient) {}

  public patient(id: string) {
    return this.db.patient.findUnique({ where: { id }, include: { village: true } });
  }

  public followUp(id: string) {
    return this.db.followUp.findUnique({
      where: { id },
      select: { id: true, patientId: true, assignedToId: true, status: true },
    });
  }

  public find(id: string, scope?: Prisma.AssessmentWhereInput) {
    return this.db.assessment.findFirst({ where: { id, ...scope }, include: detailInclude });
  }

  public async list(where: Prisma.AssessmentWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.assessment.findMany({
        where,
        include: detailInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.db.assessment.count({ where }),
    ]);
  }

  public create(data: Prisma.AssessmentUncheckedCreateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({ data });
      await tx.auditLog.create({
        data: {
          userId,
          action: "ASSESSMENT_CREATED",
          entityType: "ASSESSMENT",
          entityId: assessment.id,
          newData: data as Prisma.InputJsonValue,
        },
      });
      return assessment;
    });
  }

  public update(id: string, data: Prisma.AssessmentUpdateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const assessment = await tx.assessment.update({
        where: { id },
        data,
        include: detailInclude,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "ASSESSMENT_UPDATED",
          entityType: "ASSESSMENT",
          entityId: id,
          newData: data as Prisma.InputJsonValue,
        },
      });
      return assessment;
    });
  }

  public markCompleted(id: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const assessment = await tx.assessment.update({
        where: { id },
        data: { completedAt: new Date(), syncedAt: new Date() },
        include: detailInclude,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "ASSESSMENT_COMPLETED",
          entityType: "ASSESSMENT",
          entityId: id,
        },
      });
      return assessment;
    });
  }

  public documents(id: string, scope: Prisma.AssessmentWhereInput) {
    return this.db.patientDocument.findMany({
      where: { assessmentId: id, assessment: scope },
      include: { extraction: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
