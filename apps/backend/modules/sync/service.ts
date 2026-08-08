import { SyncStatus, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { AshaService } from "../asha/service.js";
import { ashaCreateAssessmentValidation } from "../asha/validation.js";
import { createPatientValidation, updatePatientValidation } from "../patients/validation.js";
import type { SyncRepository } from "./repository.js";
import type { SyncChangesInput, SyncInput } from "./validation.js";

export class SyncService {
  public constructor(
    private readonly repository: SyncRepository,
    private readonly access: AccessPolicy,
    private readonly asha: AshaService,
  ) {}
  public async synchronize(userId: string, input: SyncInput) {
    await this.access.requireAsha(userId);
    const results = [];
    for (const operation of input.operations) {
      const prior = await this.repository.find(operation.operationId);
      if (prior) {
        results.push(this.result(prior));
        continue;
      }
      let reserved;
      try {
        reserved = await this.repository.reserve({
          operationId: operation.operationId,
          deviceId: input.deviceId,
          entityType: operation.entityType,
          entityId: operation.entityId,
          operation: operation.operation,
          payload: operation.payload as Prisma.InputJsonValue,
        });
      } catch (error) {
        const existing = await this.repository.find(operation.operationId);
        if (existing) {
          results.push(this.result(existing));
          continue;
        }
        throw error;
      }
      try {
        if (operation.operation === "DELETE")
          throw new AppError(
            "Clinical records cannot be deleted through offline sync.",
            400,
            "SYNC_DELETE_NOT_ALLOWED",
          );
        if (operation.entityType === "PATIENT") {
          if (operation.operation === "CREATE") {
            const parsed = createPatientValidation.parse({
              ...operation.payload,
              id: operation.entityId,
            });
            await this.asha.createPatient(userId, parsed);
          } else {
            const parsed = updatePatientValidation.parse(operation.payload ?? {});
            await this.asha.updatePatient(userId, operation.entityId, parsed);
          }
        } else {
          if (operation.operation !== "CREATE")
            throw new AppError(
              "Completed assessment snapshots cannot be updated through sync.",
              409,
              "ASSESSMENT_IMMUTABLE",
            );
          const parsed = ashaCreateAssessmentValidation.parse({
            ...operation.payload,
            id: operation.entityId,
          });
          await this.asha.createAssessment(userId, parsed);
        }
        const done = await this.repository.finish(reserved.id, SyncStatus.SYNCED);
        results.push(this.result(done));
      } catch (error) {
        const code = error instanceof AppError ? error.code : "SYNC_OPERATION_FAILED";
        const message = error instanceof Error ? error.message : "Synchronization failed.";
        const failed = await this.repository.finish(reserved.id, SyncStatus.FAILED, code, message);
        results.push(this.result(failed));
      }
    }
    return {
      processed: results.length,
      succeeded: results.filter((x) => x.status === SyncStatus.SYNCED).length,
      failed: results.filter((x) => x.status === SyncStatus.FAILED).length,
      results,
    };
  }
  public async status(userId: string, deviceId: string) {
    const asha = await this.access.requireAsha(userId);
    const ids = await this.repository.ownedEntityIds(asha.id);
    const groups = await this.repository.status(deviceId, ids);
    const count = (status: SyncStatus) => groups.find((x) => x.status === status)?._count ?? 0;
    return {
      deviceId,
      pending: count(SyncStatus.PENDING),
      synced: count(SyncStatus.SYNCED),
      failed: count(SyncStatus.FAILED),
    };
  }
  public async changes(userId: string, input: SyncChangesInput) {
    const asha = await this.access.requireAsha(userId);
    const cursor = input.cursor ?? new Date(0);
    const changes = await this.repository.changes(asha.id, cursor, input.limit);
    const dates = [...changes.patients, ...changes.assessments].map((x) => x.updatedAt.getTime());
    return {
      ...changes,
      nextCursor: new Date(dates.length ? Math.max(...dates) : cursor.getTime()).toISOString(),
    };
  }
  private result(record: {
    operationId: string;
    entityId: string;
    status: SyncStatus;
    errorCode: string | null;
    errorMessage: string | null;
  }) {
    return {
      operationId: record.operationId,
      entityId: record.entityId,
      status: record.status,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
    };
  }
}
