import { z } from "zod";
const id = z.string().trim().min(1).max(200);
export const syncValidation = z
  .object({
    deviceId: id,
    operations: z
      .array(
        z
          .object({
            operationId: id,
            entityType: z.enum(["PATIENT", "ASSESSMENT"]),
            entityId: z.string().uuid(),
            operation: z.enum(["CREATE", "UPDATE", "DELETE"]),
            payload: z.record(z.unknown()).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100)
      .superRefine((items, ctx) => {
        const seen = new Set<string>();
        items.forEach((item, index) => {
          if (seen.has(item.operationId))
            ctx.addIssue({
              code: "custom",
              path: [index, "operationId"],
              message: "operationId must be unique within the batch.",
            });
          seen.add(item.operationId);
        });
      }),
  })
  .strict();
export const syncStatusValidation = z.object({ deviceId: id }).strict();
export const syncChangesValidation = z
  .object({
    cursor: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export type SyncInput = z.infer<typeof syncValidation>;
export type SyncChangesInput = z.infer<typeof syncChangesValidation>;
