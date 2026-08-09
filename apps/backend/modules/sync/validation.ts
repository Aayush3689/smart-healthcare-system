import { SyncOperationType } from "@prisma/client";
import { z } from "zod";

export const syncEntityValidation = z.enum(["PATIENT", "ASSESSMENT", "PREDICTION", "FOLLOW_UP"]);
const identifier = z.string().trim().min(1).max(200);
const change = z
  .object({
    changeId: identifier,
    entity: syncEntityValidation,
    operation: z.nativeEnum(SyncOperationType),
    clientCreatedAt: z.coerce.date().max(new Date(Date.now() + 5 * 60_000)),
    data: z.record(z.unknown()),
  })
  .strict();

export const syncPushValidation = z
  .object({ deviceId: identifier, changes: z.array(change).min(1).max(100) })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    value.changes.forEach((item, index) => {
      if (ids.has(item.changeId)) {
        context.addIssue({
          code: "custom",
          path: ["changes", index, "changeId"],
          message: "changeId must be unique within the batch.",
        });
      }
      ids.add(item.changeId);
    });
  });
export const syncPullValidation = z
  .object({
    cursor: z.string().trim().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(100),
  })
  .strict();
export const syncStatusValidation = z.object({}).strict();
export const syncRetryValidation = z
  .object({ changeIds: z.array(identifier).min(1).max(100) })
  .strict()
  .refine((value) => new Set(value.changeIds).size === value.changeIds.length, {
    message: "changeIds must be unique.",
    path: ["changeIds"],
  });

export type SyncEntity = z.infer<typeof syncEntityValidation>;
export type SyncPushInput = z.infer<typeof syncPushValidation>;
export type SyncChangeInput = SyncPushInput["changes"][number];
export type SyncPullInput = z.infer<typeof syncPullValidation>;
export type SyncRetryInput = z.infer<typeof syncRetryValidation>;
