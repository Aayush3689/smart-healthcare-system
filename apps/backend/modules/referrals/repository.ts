import {
  AssignmentStatus,
  NotificationType,
  ReferralPriority,
  ReferralStatus,
  UserStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import type { CreateReferralInput } from "./validation.js";

export const referralInclude = {
  patient: { include: { village: true } },
  assessment: { include: { predictions: { include: { reasons: true } } } },
  prediction: { include: { reasons: true, modelVersion: true } },
  recommendedPhc: true,
  assignedPhc: true,
  createdBy: { select: { id: true, email: true } },
  doctorAssignments: {
    include: { doctor: { include: { user: true } } },
    orderBy: { assignedAt: "desc" },
  },
} satisfies Prisma.ReferralInclude;

export type ReferralDetail = Prisma.ReferralGetPayload<{ include: typeof referralInclude }>;

export class ReferralRepository {
  public constructor(private readonly db: PrismaClient) {}

  public context(patientId: string, assessmentId: string, predictionId: string, phcId: string) {
    return Promise.all([
      this.db.patient.findUnique({ where: { id: patientId }, include: { village: true } }),
      this.db.assessment.findUnique({ where: { id: assessmentId } }),
      this.db.prediction.findUnique({ where: { id: predictionId } }),
      this.db.primaryHealthCentre.findUnique({ where: { id: phcId } }),
      this.db.referral.findFirst({ where: { assessmentId, predictionId } }),
    ]);
  }

  public find(id: string, scope?: Prisma.ReferralWhereInput) {
    return this.db.referral.findFirst({ where: { id, ...scope }, include: referralInclude });
  }

  public async list(where: Prisma.ReferralWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.referral.findMany({
        where,
        include: referralInclude,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.referral.count({ where }),
    ]);
  }

  public create(input: CreateReferralInput, priority: ReferralPriority, userId: string) {
    return this.db.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          patientId: input.patientId,
          assessmentId: input.assessmentId,
          predictionId: input.predictionId,
          createdById: userId,
          recommendedPhcId: input.phcId,
          priority,
          reason: input.reason,
          notes: input.notes,
          recommendedSpecialization: input.recommendedSpecialization,
        },
        include: referralInclude,
      });
      await tx.referralHistory.create({
        data: { referralId: referral.id, status: ReferralStatus.PENDING, changedById: userId },
      });
      await tx.auditLog.create({
        data: { userId, action: "REFERRAL_CREATED", entityType: "REFERRAL", entityId: referral.id },
      });
      const admins = await tx.adminProfile.findMany({
        where: { phcId: input.phcId, user: { status: UserStatus.ACTIVE } },
        select: { userId: true },
      });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.userId,
            type: NotificationType.HIGH_PRIORITY_CASE,
            title: "New patient referral",
            message: `A ${priority.toLowerCase()} priority referral requires PHC review.`,
            referenceType: "REFERRAL",
            referenceId: referral.id,
          })),
        });
      }
      return referral;
    });
  }

  public transition(id: string, status: ReferralStatus, userId: string, reason?: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.referral.findUniqueOrThrow({ where: { id } });
      const referral = await tx.referral.update({
        where: { id },
        data: {
          status,
          acceptedAt: status === ReferralStatus.ACCEPTED ? new Date() : undefined,
          completedAt: status === ReferralStatus.COMPLETED ? new Date() : undefined,
          assignedPhcId: status === ReferralStatus.ACCEPTED ? current.recommendedPhcId : undefined,
          notes: reason ? { set: reason } : undefined,
        },
        include: referralInclude,
      });
      await tx.referralHistory.create({
        data: { referralId: id, status, changedById: userId, reason },
      });
      if (status === ReferralStatus.IN_PROGRESS || status === ReferralStatus.COMPLETED) {
        await tx.doctorAssignment.updateMany({
          where: { referralId: id },
          data: {
            status:
              status === ReferralStatus.IN_PROGRESS
                ? AssignmentStatus.ACCEPTED
                : AssignmentStatus.COMPLETED,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId,
          action: `REFERRAL_${status}`,
          entityType: "REFERRAL",
          entityId: id,
        },
      });
      return referral;
    });
  }

  public doctor(id: string) {
    return this.db.doctorProfile.findUnique({ where: { id }, include: { user: true } });
  }

  public assignDoctor(id: string, doctorId: string, userId: string, notes?: string) {
    return this.db.$transaction(async (tx) => {
      await tx.doctorAssignment.create({
        data: {
          referralId: id,
          doctorId,
          assignedById: userId,
          notes,
          status: AssignmentStatus.PENDING,
        },
      });
      const referral = await tx.referral.update({
        where: { id },
        data: { status: ReferralStatus.ASSIGNED },
        include: referralInclude,
      });
      await tx.referralHistory.create({
        data: {
          referralId: id,
          status: ReferralStatus.ASSIGNED,
          changedById: userId,
          reason: notes,
        },
      });
      const doctor = await tx.doctorProfile.findUniqueOrThrow({ where: { id: doctorId } });
      await tx.notification.create({
        data: {
          userId: doctor.userId,
          type: NotificationType.REFERRAL_ASSIGNED,
          title: "Referral assigned",
          message: "A patient referral has been assigned to you.",
          referenceType: "REFERRAL",
          referenceId: id,
        },
      });
      await tx.auditLog.create({
        data: { userId, action: "REFERRAL_ASSIGNED", entityType: "REFERRAL", entityId: id },
      });
      return referral;
    });
  }

  public history(referralId: string) {
    return this.db.referralHistory.findMany({
      where: { referralId },
      include: { changedBy: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
  }
}
