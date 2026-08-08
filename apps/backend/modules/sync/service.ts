import { SyncOperationType, SyncStatus, type Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { AshaService } from "../asha/service.js";
import { ashaCreateAssessmentValidation } from "../asha/validation.js";
import { completeFollowUpValidation, missFollowUpValidation } from "../follow-ups/validation.js";
import type { FollowUpService } from "../follow-ups/service.js";
import { createPatientValidation, updatePatientValidation } from "../patients/validation.js";
import { createPredictionValidation } from "../predictions/validation.js";
import type { PredictionService } from "../predictions/service.js";
import type { PullCursor, SyncRepository } from "./repository.js";
import type {
  SyncChangeInput,
  SyncPullInput,
  SyncPushInput,
  SyncRetryInput,
} from "./validation.js";

type Outcome = {
  changeId: string;
  entity: string;
  status: SyncStatus;
  errorCode?: string;
  message?: string;
};

const entityIdValidation = z.string().uuid();

export class SyncService {
  public constructor(
    private readonly repository: SyncRepository,
    private readonly access: AccessPolicy,
    private readonly asha: AshaService,
    private readonly predictions: PredictionService,
    private readonly followUps: FollowUpService,
  ) {}

  public async push(userId: string, input: SyncPushInput) {
    await this.access.requireAsha(userId);
    const outcomes: Outcome[] = [];

    for (const change of input.changes) {
      const prior = await this.repository.find(userId, change.changeId);
      if (prior) {
        outcomes.push(this.outcome(prior));
        continue;
      }

      let reserved;
      try {
        const entityId = this.entityId(change);
        reserved = await this.repository.reserve({
          userId,
          changeId: change.changeId,
          deviceId: input.deviceId,
          entity: change.entity,
          entityId,
          operation: change.operation,
          clientCreatedAt: change.clientCreatedAt,
          data: change.data as Prisma.InputJsonValue,
        });
      } catch (error) {
        const raced = await this.repository.find(userId, change.changeId);
        if (raced) {
          outcomes.push(this.outcome(raced));
          continue;
        }
        outcomes.push(this.unreservedFailure(change, error));
        continue;
      }
      outcomes.push(await this.process(userId, reserved.id, change));
    }

    return this.partition(outcomes);
  }

  public async retry(userId: string, input: SyncRetryInput) {
    await this.access.requireAsha(userId);
    const records = await this.repository.retryable(userId, input.changeIds);
    const retryable = new Map(records.map((record) => [record.operationId, record]));
    const outcomes: Outcome[] = [];

    for (const changeId of input.changeIds) {
      const record = retryable.get(changeId);
      if (!record) {
        outcomes.push({
          changeId,
          entity: "UNKNOWN",
          status: SyncStatus.FAILED,
          errorCode: "CHANGE_NOT_RETRYABLE",
          message: "The change was not found or is not in a retryable state.",
        });
        continue;
      }
      await this.repository.markPending(record.id);
      const change: SyncChangeInput = {
        changeId: record.operationId,
        entity: record.entityType as SyncChangeInput["entity"],
        operation: record.operation,
        clientCreatedAt: record.clientCreatedAt,
        data: (record.payload ?? {}) as Record<string, unknown>,
      };
      outcomes.push(await this.process(userId, record.id, change));
    }

    return this.partition(outcomes);
  }

  public async status(userId: string) {
    await this.access.requireAsha(userId);
    const result = await this.repository.status(userId);
    const count = (status: SyncStatus) =>
      result.groups.find((group) => group.status === status)?._count ?? 0;
    return {
      lastSyncedAt: result.lastSyncedAt,
      pendingChanges: count(SyncStatus.PENDING),
      failedChanges: count(SyncStatus.FAILED),
      hasConflicts: count(SyncStatus.CONFLICT) > 0,
    };
  }

  public async pull(userId: string, input: SyncPullInput) {
    const asha = await this.access.requireAsha(userId);
    const cursor = input.cursor ? this.decodeCursor(input.cursor) : undefined;
    const result = await this.repository.pull(asha.id, cursor, input.limit + 1);
    const changes = [
      ...this.pullItems("PATIENT", result.patients),
      ...this.pullItems("ASSESSMENT", result.assessments),
      ...this.pullItems("PREDICTION", result.predictions),
      ...this.pullItems("FOLLOW_UP", result.followUps),
      ...this.pullItems("APPOINTMENT", result.appointments),
      ...this.pullItems("REFERRAL", result.referrals),
    ].sort(
      (a, b) =>
        a.updatedAt.getTime() - b.updatedAt.getTime() ||
        a.entity.localeCompare(b.entity) ||
        a.id.localeCompare(b.id),
    );
    const hasMore = changes.length > input.limit;
    const page = changes.slice(0, input.limit);
    const last = page.at(-1);
    return {
      changes: page,
      nextCursor: last
        ? this.encodeCursor({ updatedAt: last.updatedAt, entity: last.entity, id: last.id })
        : (input.cursor ?? null),
      hasMore,
    };
  }

  private async process(
    userId: string,
    recordId: string,
    change: SyncChangeInput,
  ): Promise<Outcome> {
    try {
      const entityId = this.entityId(change);
      await this.apply(userId, entityId, change);
      const record = await this.repository.finish(recordId, SyncStatus.SYNCED, {
        entityId,
      } as Prisma.InputJsonValue);
      return this.outcome(record);
    } catch (error) {
      const normalized = this.normalizeError(error);
      const status = normalized.conflict ? SyncStatus.CONFLICT : SyncStatus.FAILED;
      const record = await this.repository.finish(
        recordId,
        status,
        undefined,
        normalized.code,
        normalized.message,
      );
      return this.outcome(record);
    }
  }

  private async apply(userId: string, entityId: string, change: SyncChangeInput): Promise<void> {
    const data = { ...change.data };
    delete data.id;

    if (change.entity === "PATIENT") {
      if (change.operation === SyncOperationType.DELETE) throw this.deleteError();
      if (change.operation === SyncOperationType.CREATE) {
        await this.asha.createPatient(
          userId,
          createPatientValidation.parse({
            ...data,
            id: entityId,
            deviceId: data.deviceId ?? undefined,
            clientCreatedAt: data.clientCreatedAt ?? change.clientCreatedAt,
          }),
        );
      } else {
        await this.asha.updatePatient(userId, entityId, updatePatientValidation.parse(data));
      }
      return;
    }

    if (change.entity === "ASSESSMENT") {
      if (change.operation !== SyncOperationType.CREATE) throw this.immutable("ASSESSMENT");
      await this.asha.createAssessment(
        userId,
        ashaCreateAssessmentValidation.parse({ ...data, id: entityId }),
      );
      return;
    }

    if (change.entity === "PREDICTION") {
      if (change.operation !== SyncOperationType.CREATE) throw this.immutable("PREDICTION");
      await this.predictions.create(
        userId,
        createPredictionValidation.parse({ ...data, id: entityId }),
      );
      return;
    }

    if (change.operation !== SyncOperationType.UPDATE) throw this.immutable("FOLLOW_UP");
    const action = data.action;
    delete data.action;
    if (action === "START") {
      await this.followUps.start(userId, entityId);
    } else if (action === "COMPLETE") {
      await this.followUps.complete(userId, entityId, completeFollowUpValidation.parse(data));
    } else if (action === "MISSED") {
      const parsed = missFollowUpValidation.parse(data);
      await this.followUps.missed(userId, entityId, parsed.reason);
    } else {
      throw new AppError(
        "FOLLOW_UP updates require action START, COMPLETE, or MISSED.",
        400,
        "INVALID_FOLLOW_UP_ACTION",
      );
    }
  }

  private entityId(change: SyncChangeInput): string {
    return entityIdValidation.parse(change.data.id);
  }

  private immutable(entity: string) {
    return new AppError(
      `${entity} records cannot use this offline operation.`,
      409,
      `${entity}_IMMUTABLE`,
    );
  }

  private deleteError() {
    return new AppError(
      "Clinical records cannot be deleted through offline sync.",
      409,
      "SYNC_DELETE_NOT_ALLOWED",
    );
  }

  private normalizeError(error: unknown) {
    if (error instanceof ZodError) {
      return {
        code: "VALIDATION_ERROR",
        message: error.issues[0]?.message ?? "Invalid change data.",
        conflict: false,
      };
    }
    if (error instanceof AppError) {
      return { code: error.code, message: error.message, conflict: error.statusCode === 409 };
    }
    return {
      code: "SYNC_CHANGE_FAILED",
      message: error instanceof Error ? error.message : "The offline change could not be applied.",
      conflict: false,
    };
  }

  private unreservedFailure(change: SyncChangeInput, error: unknown): Outcome {
    const normalized = this.normalizeError(error);
    return {
      changeId: change.changeId,
      entity: change.entity,
      status: normalized.conflict ? SyncStatus.CONFLICT : SyncStatus.FAILED,
      errorCode: normalized.code,
      message: normalized.message,
    };
  }

  private outcome(record: {
    operationId: string;
    entityType: string;
    status: SyncStatus;
    errorCode: string | null;
    errorMessage: string | null;
  }): Outcome {
    return {
      changeId: record.operationId,
      entity: record.entityType,
      status: record.status,
      ...(record.errorCode ? { errorCode: record.errorCode } : {}),
      ...(record.errorMessage ? { message: record.errorMessage } : {}),
    };
  }

  private partition(outcomes: Outcome[]) {
    return {
      accepted: outcomes.filter((outcome) => outcome.status === SyncStatus.SYNCED),
      conflicts: outcomes.filter((outcome) => outcome.status === SyncStatus.CONFLICT),
      failed: outcomes.filter(
        (outcome) => outcome.status !== SyncStatus.SYNCED && outcome.status !== SyncStatus.CONFLICT,
      ),
    };
  }

  private pullItems(
    entity: string,
    items: Array<{ id: string; createdAt: Date; updatedAt: Date }>,
  ) {
    return items.map((item) => ({
      entity,
      operation: item.createdAt.getTime() === item.updatedAt.getTime() ? "CREATE" : "UPDATE",
      id: item.id,
      updatedAt: item.updatedAt,
      data: item,
    }));
  }

  private encodeCursor(cursor: PullCursor): string {
    return Buffer.from(
      JSON.stringify({ v: 1, t: cursor.updatedAt.toISOString(), e: cursor.entity, id: cursor.id }),
    ).toString("base64url");
  }

  private decodeCursor(value: string): PullCursor {
    try {
      const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
        v?: unknown;
        t?: unknown;
        e?: unknown;
        id?: unknown;
      };
      if (
        decoded.v !== 1 ||
        typeof decoded.t !== "string" ||
        typeof decoded.e !== "string" ||
        typeof decoded.id !== "string"
      )
        throw new Error();
      const updatedAt = new Date(decoded.t);
      if (Number.isNaN(updatedAt.getTime()) || !decoded.id) throw new Error();
      return { updatedAt, entity: decoded.e, id: decoded.id };
    } catch {
      throw new AppError("The sync cursor is invalid.", 400, "INVALID_SYNC_CURSOR");
    }
  }
}
