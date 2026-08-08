import { AppointmentStatus, ReferralStatus, Role, UserStatus, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { AppointmentDetail, AppointmentRepository } from "./repository.js";
import type {
  AppointmentListQuery,
  CreateAppointmentInput,
  RescheduleAppointmentInput,
} from "./validation.js";

export class AppointmentService {
  public constructor(
    private readonly repository: AppointmentRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, input: CreateAppointmentInput) {
    const admin = await this.access.requireAdminPhc(userId);
    const [referral, patient, doctor] = await this.repository.context(
      input.referralId,
      input.patientId,
      input.doctorId,
    );
    if (
      !referral ||
      !patient ||
      referral.patientId !== patient.id ||
      ![referral.recommendedPhcId, referral.assignedPhcId].includes(admin.phcId)
    ) {
      throw new AppError("Referral not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (referral.status !== ReferralStatus.ASSIGNED) {
      throw new AppError(
        "An appointment can be created only after a doctor is assigned.",
        409,
        "INVALID_REFERRAL_STATE",
      );
    }
    if (
      !doctor ||
      doctor.user.status !== UserStatus.ACTIVE ||
      doctor.phcId !== admin.phcId ||
      !referral.doctorAssignments.some((assignment) => assignment.doctorId === doctor.id)
    ) {
      throw new AppError(
        "The doctor is inactive, belongs to another PHC, or is not assigned to this referral.",
        422,
        "INVALID_APPOINTMENT_DOCTOR",
      );
    }
    if (
      referral.appointments.some(
        (appointment) => appointment.status !== AppointmentStatus.CANCELLED,
      )
    ) {
      throw new AppError(
        "An active appointment already exists for this referral.",
        409,
        "APPOINTMENT_ALREADY_EXISTS",
      );
    }
    return this.map(await this.repository.create(input, admin.phcId, userId));
  }

  public async get(userId: string, role: Role, id: string) {
    const appointment = await this.repository.find(id, await this.scope(userId, role));
    if (!appointment) throw new AppError("Appointment not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(appointment);
  }

  public async list(userId: string, role: Role, query: AppointmentListQuery) {
    if (role !== Role.PHC_ADMIN && (query.doctorId || query.villageId || query.priority)) {
      throw this.access.forbidden();
    }
    const where: Prisma.AppointmentWhereInput = {
      AND: [
        await this.scope(userId, role),
        {
          status: query.status,
          patientId: query.patientId,
          doctorId: query.doctorId,
          patient: query.villageId ? { villageId: query.villageId } : undefined,
          referral: query.priority ? { priority: query.priority } : undefined,
          scheduledAt: this.dateFilter(query),
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      appointments: items.map((item) => this.map(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  public patientAppointments(
    userId: string,
    role: Role,
    patientId: string,
    query: AppointmentListQuery,
  ) {
    return this.list(userId, role, { ...query, patientId });
  }

  public async history(userId: string, role: Role, id: string) {
    await this.get(userId, role, id);
    return this.repository.history(id);
  }

  public async confirm(userId: string, role: Role, id: string) {
    const appointment = await this.requireAppointment(userId, role, id);
    if (role !== Role.DOCTOR && role !== Role.PHC_ADMIN) throw this.access.forbidden();
    this.assertStatus(
      appointment.status,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      "confirm",
    );
    return this.map(await this.repository.transition(id, AppointmentStatus.CONFIRMED, userId));
  }

  public async start(userId: string, id: string) {
    const appointment = await this.requireDoctorAppointment(userId, id);
    this.assertStatus(appointment.status, [AppointmentStatus.CONFIRMED], "start");
    return this.map(await this.repository.transition(id, AppointmentStatus.IN_PROGRESS, userId));
  }

  public async complete(userId: string, id: string) {
    const appointment = await this.requireDoctorAppointment(userId, id);
    this.assertStatus(appointment.status, [AppointmentStatus.IN_PROGRESS], "complete");
    return this.map(await this.repository.transition(id, AppointmentStatus.COMPLETED, userId));
  }

  public async cancel(userId: string, role: Role, id: string, reason: string) {
    const appointment = await this.requireAppointment(userId, role, id);
    this.assertStatus(
      appointment.status,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED],
      "cancel",
    );
    return this.map(
      await this.repository.transition(id, AppointmentStatus.CANCELLED, userId, reason),
    );
  }

  public async reschedule(
    userId: string,
    role: Role,
    id: string,
    input: RescheduleAppointmentInput,
  ) {
    if (role !== Role.DOCTOR && role !== Role.PHC_ADMIN) throw this.access.forbidden();
    const appointment = await this.requireAppointment(userId, role, id);
    this.assertStatus(
      appointment.status,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED],
      "reschedule",
    );
    return this.map(
      await this.repository.reschedule(
        id,
        appointment.doctorId,
        input.scheduledAt,
        userId,
        input.reason,
      ),
    );
  }

  public async noShow(userId: string, role: Role, id: string) {
    if (role !== Role.DOCTOR && role !== Role.PHC_ADMIN) throw this.access.forbidden();
    const appointment = await this.requireAppointment(userId, role, id);
    this.assertStatus(appointment.status, [AppointmentStatus.CONFIRMED], "mark as no-show");
    return this.map(await this.repository.transition(id, AppointmentStatus.NO_SHOW, userId));
  }

  private async requireAppointment(userId: string, role: Role, id: string) {
    const appointment = await this.repository.find(id, await this.scope(userId, role));
    if (!appointment) throw new AppError("Appointment not found.", 404, "RESOURCE_NOT_FOUND");
    return appointment;
  }

  private async requireDoctorAppointment(userId: string, id: string) {
    const doctor = await this.access.requireDoctor(userId);
    const appointment = await this.repository.find(id, { doctorId: doctor.id });
    if (!appointment) throw new AppError("Appointment not found.", 404, "RESOURCE_NOT_FOUND");
    return appointment;
  }

  private async scope(userId: string, role: Role): Promise<Prisma.AppointmentWhereInput> {
    if (role === Role.ASHA_WORKER) {
      const asha = await this.access.requireAsha(userId);
      return { patient: { registeredById: asha.id } };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return { doctorId: doctor.id };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { phcId: admin.phcId };
    }
    throw this.access.forbidden();
  }

  private dateFilter(query: AppointmentListQuery): Prisma.DateTimeFilter | undefined {
    if (query.date) {
      const start = new Date(query.date);
      start.setUTCHours(0, 0, 0, 0);
      return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
    }
    return query.from || query.to ? { gte: query.from, lte: query.to } : undefined;
  }

  private assertStatus(
    current: AppointmentStatus,
    allowed: AppointmentStatus[],
    action: string,
  ): void {
    if (!allowed.includes(current)) {
      throw new AppError(
        `Cannot ${action} an appointment with status ${current}.`,
        409,
        "INVALID_APPOINTMENT_TRANSITION",
      );
    }
  }

  private map(appointment: AppointmentDetail) {
    const dateOfBirth = appointment.patient.dateOfBirth;
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    if (
      now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
      (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
        now.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age--;
    }
    return {
      id: appointment.id,
      patient: {
        id: appointment.patient.id,
        fullName: appointment.patient.fullName,
        age,
        gender: appointment.patient.gender,
      },
      patientId: appointment.patientId,
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.fullName,
        specialization: appointment.doctor.specialization,
      },
      doctorId: appointment.doctorId,
      phc: {
        id: appointment.phc.id,
        name: appointment.phc.name,
        address: appointment.phc.address,
      },
      phcId: appointment.phcId,
      referralId: appointment.referralId,
      priority: appointment.referral?.priority ?? null,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      latestAssessment: appointment.patient.assessments[0] ?? null,
      predictions: appointment.patient.assessments[0]?.predictions ?? [],
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}
