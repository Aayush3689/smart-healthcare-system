import { z } from "zod";
export const extractionUpdate = z.object({ extractedData: z.record(z.unknown()) }).strict();
