import type { Role } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { PatientRepository } from "./repository.js";
import type { CreatePatientInput, UpdatePatientInput } from "./validation.js";
export class PatientService {
  public constructor(
    private readonly repo: PatientRepository,
    private readonly access: AccessPolicy,
  ) {}
  async create(userId: string, input: CreatePatientInput) {
    const a = await this.access.requireAsha(userId);
    const v = await this.repo.village(input.villageId);
    if (!v?.isActive || v.phcId !== a.village.phcId)
      throw new AppError("Village is outside your PHC.", 400, "INVALID_VILLAGE");
    if (input.id && (await this.repo.find(input.id)))
      throw new AppError("Patient ID already exists.", 409, "RESOURCE_CONFLICT");
    return this.repo.create({ ...input, registeredById: a.id, syncedAt: new Date() }, userId);
  }
  async update(userId: string, _role: Role, id: string, input: UpdatePatientInput) {
    const a = await this.access.requireAsha(userId);
    const p = await this.repo.find(id);
    if (!p || p.registeredById !== a.id) throw this.access.forbidden();
    return this.repo.update(id, input, userId);
  }
  async history(userId: string, _role: Role, id: string, type: string) {
    const a = await this.access.requireAsha(userId);
    const p = await this.repo.find(id);
    if (!p || p.registeredById !== a.id) throw this.access.forbidden();
    return this.repo.history(id, type);
  }
}
