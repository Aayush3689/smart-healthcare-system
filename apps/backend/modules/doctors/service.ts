import { UserStatus, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { DoctorDetail, DoctorRepository } from "./repository.js";
import type {
  CreateDoctorInput,
  DoctorListQuery,
  DoctorPatientListQuery,
  UpdateAvailabilityInput,
  UpdateDoctorInput,
} from "./validation.js";

export class DoctorService {
  public constructor(
    private readonly repository: DoctorRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async list(userId: string, query: DoctorListQuery) {
    const admin = await this.access.requireAdminPhc(userId);
    const where: Prisma.DoctorProfileWhereInput = {
      phcId: admin.phcId,
      specialization: query.specialization
        ? { contains: query.specialization, mode: "insensitive" }
        : undefined,
      user: { status: query.status },
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { user: { email: { contains: query.search, mode: "insensitive" } } },
          ]
        : undefined,
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((doctor) => this.map(doctor)),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async create(userId: string, input: CreateDoctorInput) {
    const admin = await this.access.requireAdminPhc(userId);
    if (await this.repository.userByEmail(input.email)) {
      throw new AppError("Email is already in use.", 409, "EMAIL_ALREADY_EXISTS");
    }
    return this.map(await this.repository.create(input, admin.phcId, userId));
  }

  public async get(userId: string, doctorId: string) {
    const admin = await this.access.requireAdminPhc(userId);
    return this.map(await this.requireDoctor(doctorId, admin.phcId));
  }

  public async me(userId: string) {
    await this.access.requireDoctor(userId);
    const doctor = await this.repository.findByUserId(userId);
    if (!doctor) throw new AppError("Doctor profile not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(doctor);
  }

  public async update(userId: string, doctorId: string, input: UpdateDoctorInput) {
    const admin = await this.access.requireAdminPhc(userId);
    await this.requireDoctor(doctorId, admin.phcId);
    return this.map(await this.repository.update(doctorId, input, userId));
  }

  public async updateMe(userId: string, input: UpdateDoctorInput) {
    const doctor = await this.access.requireDoctor(userId);
    return this.map(await this.repository.update(doctor.id, input, userId));
  }

  public async activate(userId: string, doctorId: string) {
    const admin = await this.access.requireAdminPhc(userId);
    const doctor = await this.requireDoctor(doctorId, admin.phcId);
    if (doctor.user.status !== UserStatus.INACTIVE) {
      throw new AppError("Only an inactive doctor can be activated.", 409, "INVALID_DOCTOR_STATUS");
    }
    return this.map(await this.repository.updateStatus(doctorId, UserStatus.ACTIVE, userId));
  }

  public async deactivate(userId: string, doctorId: string) {
    const admin = await this.access.requireAdminPhc(userId);
    const doctor = await this.requireDoctor(doctorId, admin.phcId);
    if (doctor.user.status !== UserStatus.ACTIVE) {
      throw new AppError("Only an active doctor can be deactivated.", 409, "INVALID_DOCTOR_STATUS");
    }
    const [appointments, assignments] = await this.repository.deactivationBlockers(doctorId);
    if (appointments || assignments) {
      throw new AppError(
        "Doctor has active appointments or assignments and cannot be deactivated.",
        409,
        "DOCTOR_HAS_ACTIVE_CARE",
      );
    }
    return this.map(await this.repository.updateStatus(doctorId, UserStatus.INACTIVE, userId));
  }

  public async availability(userId: string) {
    const doctor = await this.access.requireDoctor(userId);
    return (await this.repository.availability(doctor.id))?.schedule ?? {};
  }

  public async adminAvailability(userId: string, doctorId: string) {
    const admin = await this.access.requireAdminPhc(userId);
    await this.requireDoctor(doctorId, admin.phcId);
    return (await this.repository.availability(doctorId))?.schedule ?? {};
  }

  public async updateAvailability(userId: string, input: UpdateAvailabilityInput) {
    const doctor = await this.access.requireDoctor(userId);
    const existing = await this.repository.availability(doctor.id);
    const current = this.isRecord(existing?.schedule) ? existing.schedule : {};
    const schedule = { ...current, ...input.schedule } as Prisma.InputJsonObject;
    return (await this.repository.updateAvailability(doctor.id, schedule, userId)).schedule;
  }

  public async summary(userId: string) {
    const doctor = await this.access.requireDoctor(userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return this.repository.summary(doctor.id, today);
  }

  public async patients(userId: string, query: DoctorPatientListQuery) {
    const doctor = await this.access.requireDoctor(userId);
    const where: Prisma.PatientWhereInput = {
      fullName: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
      assessments: query.riskLevel
        ? { some: { predictions: { some: { riskLevel: query.riskLevel } } } }
        : undefined,
      referrals: query.referralStatus ? { some: { status: query.referralStatus } } : undefined,
    };
    const [items, total] = await this.repository.patients(
      doctor.id,
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        age: this.age(patient.dateOfBirth),
        gender: patient.gender,
        phone: patient.phone,
        village: patient.village,
        latestAssessment: patient.assessments[0] ?? null,
        latestPrediction: patient.assessments[0]?.predictions[0] ?? null,
        latestReferral: patient.referrals[0] ?? null,
        latestAppointment: patient.appointments[0] ?? null,
        updatedAt: patient.updatedAt,
      })),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async patient(userId: string, patientId: string) {
    const doctor = await this.access.requireDoctor(userId);
    const patient = await this.repository.patient(doctor.id, patientId);
    if (!patient) throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    return { ...patient, age: this.age(patient.dateOfBirth) };
  }

  private async requireDoctor(id: string, phcId: string) {
    const doctor = await this.repository.findById(id, phcId);
    if (!doctor) throw new AppError("Doctor not found.", 404, "RESOURCE_NOT_FOUND");
    return doctor;
  }

  private map(doctor: DoctorDetail) {
    return {
      id: doctor.id,
      userId: doctor.userId,
      fullName: doctor.fullName,
      email: doctor.user.email,
      specialization: doctor.specialization,
      status: doctor.user.status,
      phc: { id: doctor.phc.id, name: doctor.phc.name, address: doctor.phc.address },
      availability: doctor.availability?.schedule ?? {},
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
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

  private isRecord(value: unknown): value is Prisma.JsonObject {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
}
