import { z } from "zod";
const text = z.string().trim().min(1).max(150);
export const villageCreate = z
  .object({
    name: text,
    district: text,
    state: text,
    population: z.number().int().nonnegative().optional(),
  })
  .strict();
