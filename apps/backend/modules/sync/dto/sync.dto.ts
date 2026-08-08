import type { z } from "zod";
import type { syncPullValidation, syncPushValidation, syncRetryValidation } from "../validation.js";

export type SyncPushRequest = z.infer<typeof syncPushValidation>;
export type SyncPullRequest = z.infer<typeof syncPullValidation>;
export type SyncRetryRequest = z.infer<typeof syncRetryValidation>;
