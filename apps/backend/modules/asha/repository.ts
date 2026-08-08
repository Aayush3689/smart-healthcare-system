import {
  FollowUpStatus,
  OcrStatus,
  ReferralStatus,
  RiskLevel,
  SyncStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
export class AshaRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public profile(userId: string) {
    return this.prisma.ashaWorkerProfile.findUnique({
      where: { userId },
      include: { user: true, village: { include: { phc: true } } },
    });
  }
  public updateProfile(id: string, userId: string, fullName: string) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.ashaWorkerProfile.update({
        where: { id },
        data: { fullName },
        include: { user: true, village: { include: { phc: true } } },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "ASHA_PROFILE_UPDATED",
          entityType: "ASHA_WORKER",
          entityId: id,
          newData: { fullName },
        },
      });
      return profile;
    });
  }
  public async dashboard(ashaId: string, userId: string, startToday: Date, startMonth: Date) {
    const patientWhere = { registeredById: ashaId };
    const assessmentWhere = { conductedById: ashaId };
    const [
      total,
      registeredThisMonth,
      todayAssessments,
      monthAssessments,
      risks,
      referrals,
      pendingFollowUps,
      todayFollowUps,
      ids,
    ] = await Promise.all([
      this.prisma.patient.count({ where: patientWhere }),
      this.prisma.patient.count({ where: { ...patientWhere, createdAt: { gte: startMonth } } }),
      this.prisma.assessment.count({
        where: { ...assessmentWhere, createdAt: { gte: startToday } },
      }),
      this.prisma.assessment.count({
        where: { ...assessmentWhere, createdAt: { gte: startMonth } },
      }),
      this.prisma.prediction.groupBy({
        by: ["riskLevel"],
        where: { assessment: assessmentWhere },
        _count: true,
      }),
      this.prisma.referral.groupBy({
        by: ["status"],
        where: { createdById: userId },
        _count: true,
      }),
      this.prisma.followUp.count({
        where: { assignedToId: ashaId, status: FollowUpStatus.PENDING },
      }),
      this.prisma.followUp.count({
        where: {
          assignedToId: ashaId,
          status: FollowUpStatus.PENDING,
          scheduledDate: { gte: startToday, lt: new Date(startToday.getTime() + 86_400_000) },
        },
      }),
      this.prisma.patient.findMany({ where: patientWhere, select: { id: true } }),
    ]);
    const entityIds = ids.map((p) => p.id);
    const sync = await this.prisma.syncOperation.groupBy({
      by: ["status"],
      where: {
        entityId: { in: entityIds },
        status: { in: [SyncStatus.PENDING, SyncStatus.FAILED] },
      },
      _count: true,
    });
    return {
      total,
      registeredThisMonth,
      todayAssessments,
      monthAssessments,
      risks,
      referrals,
      pendingFollowUps,
      todayFollowUps,
      sync,
    };
  }
  public statistics(ashaId: string, userId: string, range: Prisma.DateTimeFilter) {
    return Promise.all([
      this.prisma.patient.count({ where: { registeredById: ashaId, createdAt: range } }),
      this.prisma.assessment.count({ where: { conductedById: ashaId, createdAt: range } }),
      this.prisma.prediction.groupBy({
        by: ["assessmentId"],
        where: {
          assessment: { conductedById: ashaId, createdAt: range },
          riskLevel: RiskLevel.HIGH,
        },
        _count: true,
      }),
      this.prisma.referral.count({ where: { createdById: userId, createdAt: range } }),
      this.prisma.referral.count({
        where: { createdById: userId, status: ReferralStatus.COMPLETED, createdAt: range },
      }),
      this.prisma.followUp.count({
        where: { assignedToId: ashaId, status: FollowUpStatus.PENDING, createdAt: range },
      }),
      this.prisma.followUp.count({
        where: { assignedToId: ashaId, status: FollowUpStatus.COMPLETED, createdAt: range },
      }),
    ]);
  }
  public patients(ashaId: string, where: Prisma.PatientWhereInput, skip: number, take: number) {
    return Promise.all([
      this.prisma.patient.findMany({
        where: { registeredById: ashaId, ...where },
        include: {
          village: true,
          assessments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { predictions: { orderBy: { probability: "desc" }, take: 1 } },
          },
        },
        skip,
        take,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.patient.count({ where: { registeredById: ashaId, ...where } }),
    ]);
  }
  public patient(ashaId: string, id: string) {
    return this.prisma.patient.findFirst({
      where: { id, registeredById: ashaId },
      include: {
        village: true,
        assessments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { predictions: { include: { reasons: true, modelVersion: true } } },
        },
        referrals: { where: { status: { in: [ReferralStatus.PENDING, ReferralStatus.ACCEPTED] } } },
        followUps: { where: { status: FollowUpStatus.PENDING } },
      },
    });
  }
  public assessments(
    ashaId: string,
    where: Prisma.AssessmentWhereInput,
    skip: number,
    take: number,
  ) {
    return Promise.all([
      this.prisma.assessment.findMany({
        where: { conductedById: ashaId, ...where },
        include: { patient: true, predictions: { include: { reasons: true, modelVersion: true } } },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.assessment.count({ where: { conductedById: ashaId, ...where } }),
    ]);
  }
  public referrals(userId: string, where: Prisma.ReferralWhereInput) {
    return this.prisma.referral.findMany({
      where: { createdById: userId, ...where },
      include: {
        patient: true,
        recommendedPhc: true,
        assignedPhc: true,
        doctorAssignments: { include: { doctor: true } },
        appointments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
  public referral(userId: string, id: string) {
    return this.prisma.referral.findFirst({
      where: { id, createdById: userId },
      include: {
        patient: true,
        recommendedPhc: true,
        assignedPhc: true,
        doctorAssignments: { include: { doctor: true } },
        appointments: true,
      },
    });
  }
  public followUps(ashaId: string, status?: FollowUpStatus) {
    return this.prisma.followUp.findMany({
      where: { assignedToId: ashaId, status },
      include: { patient: true, doctor: true, appointment: true },
      orderBy: { scheduledDate: "asc" },
    });
  }
  public followUp(ashaId: string, id: string) {
    return this.prisma.followUp.findFirst({
      where: { id, assignedToId: ashaId },
      include: { patient: true, doctor: { include: { user: true } }, appointment: true },
    });
  }
  public completeFollowUp(id: string, userId: string, doctorUserId: string, notes: string) {
    return this.prisma.$transaction(async (tx) => {
      const followUp = await tx.followUp.update({
        where: { id },
        data: { status: FollowUpStatus.COMPLETED, completedDate: new Date(), notes },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "FOLLOW_UP_COMPLETED",
          entityType: "FOLLOW_UP",
          entityId: id,
          newData: { notes },
        },
      });
      await tx.notification.create({
        data: {
          userId: doctorUserId,
          type: "FOLLOW_UP_REMINDER",
          title: "Follow-up completed",
          message: "An assigned patient follow-up was completed.",
          referenceType: "FOLLOW_UP",
          referenceId: id,
        },
      });
      return followUp;
    });
  }
  public appointments(ashaId: string, range?: Prisma.DateTimeFilter) {
    return this.prisma.appointment.findMany({
      where: { patient: { registeredById: ashaId }, scheduledAt: range },
      include: { patient: true, doctor: true, phc: true },
      orderBy: { scheduledAt: "asc" },
    });
  }
  public notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  public markNotification(userId: string, id: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }
  public markAllNotifications(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
  public documents(patientId: string) {
    return this.prisma.patientDocument.findMany({
      where: { patientId },
      include: { extraction: true },
      orderBy: { createdAt: "desc" },
    });
  }
  public createDocument(data: Prisma.PatientDocumentUncheckedCreateInput) {
    return this.prisma.patientDocument.create({ data });
  }
  public document(id: string) {
    return this.prisma.patientDocument.findUnique({
      where: { id },
      include: { patient: true, extraction: true },
    });
  }
  public setOcr(id: string, status: OcrStatus) {
    return this.prisma.patientDocument.update({ where: { id }, data: { ocrStatus: status } });
  }
  public extraction(documentId: string) {
    return this.prisma.documentExtraction.findUnique({ where: { documentId } });
  }
  public correctExtraction(documentId: string, extractedData: Prisma.InputJsonValue) {
    return this.prisma.documentExtraction.upsert({
      where: { documentId },
      create: { documentId, extractedData },
      update: { extractedData },
    });
  }
}
