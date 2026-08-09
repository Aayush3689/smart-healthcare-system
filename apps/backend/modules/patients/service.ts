import { Role, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { PatientDetail, PatientRepository } from "./repository.js";
import type {
  CreatePatientInput,
  PatientListQuery,
  PatientTimelineQuery,
  UpdatePatientInput,
} from "./validation.js";

export class PatientService {
  public constructor(
    private readonly repository: PatientRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, input: CreatePatientInput) {
    const asha = await this.access.requireAsha(userId);
    const village = await this.repository.village(input.villageId);
    if (!village?.isActive || village.id !== asha.villageId) {
      throw new AppError(
        "Patients can only be registered in your assigned village.",
        422,
        "INVALID_VILLAGE",
      );
    }
    if (input.id && (await this.repository.find(input.id))) {
      throw new AppError("Patient ID already exists.", 409, "RESOURCE_CONFLICT");
    }
    return this.map(
      await this.repository.create(
        { ...input, registeredById: asha.id, syncedAt: new Date() },
        userId,
      ),
    );
  }

  public async list(userId: string, role: Role, query: PatientListQuery) {
    const scope = await this.scope(userId, role);
    const where: Prisma.PatientWhereInput = {
      AND: [
        scope,
        {
          fullName: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
          villageId: query.villageId,
          registeredById: query.ashaWorkerId,
          gender: query.gender,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((patient) => this.listItem(patient)),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async get(userId: string, role: Role, id: string) {
    const patient = await this.repository.find(id, await this.scope(userId, role));
    if (!patient) throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(patient);
  }

  public async update(userId: string, _role: Role, id: string, input: UpdatePatientInput) {
    const asha = await this.access.requireAsha(userId);
    const patient = await this.repository.find(id, { registeredById: asha.id });
    if (!patient) throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(await this.repository.update(id, input, userId));
  }

  public async summary(userId: string, role: Role, id: string) {
    const patient = await this.repository.summary(id, await this.scope(userId, role));
    if (!patient) throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    const latestAssessment = patient.assessments[0] ?? null;
    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        age: this.age(patient.dateOfBirth),
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        village: patient.village,
        registeredBy: patient.registeredBy,
      },
      latestAssessment,
      latestPredictions: latestAssessment?.predictions ?? [],
      activeReferrals: patient.referrals,
      upcomingAppointment: patient.appointments[0] ?? null,
      pendingFollowUps: patient.followUps,
      latestClinicalNote: patient.clinicalNotes[0] ?? null,
    };
  }

  public async timeline(userId: string, role: Role, id: string, query: PatientTimelineQuery) {
    if (!(await this.repository.find(id, await this.scope(userId, role)))) {
      throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    }
    const range = query.from || query.to ? { gte: query.from, lte: query.to } : undefined;
    const allItems = (await this.repository.timeline(id, range)).filter(
      (item) => !query.type || item.type === query.type,
    );
    const start = (query.page - 1) * query.limit;
    return {
      items: allItems.slice(start, start + query.limit),
      pagination: { page: query.page, limit: query.limit, total: allItems.length },
    };
  }

  public async history(userId: string, _role: Role, id: string, type: string) {
    const asha = await this.access.requireAsha(userId);
    const patient = await this.repository.find(id, { registeredById: asha.id });
    if (!patient) throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    return this.repository.history(id, type);
  }

  private async scope(userId: string, role: Role): Promise<Prisma.PatientWhereInput> {
    if (role === Role.ASHA_WORKER) {
      const asha = await this.access.requireAsha(userId);
      return { registeredById: asha.id };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { village: { phcId: admin.phcId } };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return {
        OR: [
          { appointments: { some: { doctorId: doctor.id } } },
          { referrals: { some: { doctorAssignments: { some: { doctorId: doctor.id } } } } },
        ],
      };
    }
    throw this.access.forbidden();
  }

  private map(patient: PatientDetail) {
    return {
      id: patient.id,
      fullName: patient.fullName,
      age: this.age(patient.dateOfBirth),
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      villageId: patient.villageId,
      village: { id: patient.village.id, name: patient.village.name },
      registeredById: patient.registeredById,
      registeredBy: patient.registeredBy,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelation: patient.emergencyContactRelation,
      clientCreatedAt: patient.clientCreatedAt,
      syncedAt: patient.syncedAt,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  private listItem(patient: PatientDetail) {
    return {
      id: patient.id,
      fullName: patient.fullName,
      age: this.age(patient.dateOfBirth),
      gender: patient.gender,
      village: { id: patient.village.id, name: patient.village.name },
      registeredBy: patient.registeredBy,
    };
  }

  private age(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    if (
      now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
      (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
        now.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age--;
    }
    return age;
  }
}
