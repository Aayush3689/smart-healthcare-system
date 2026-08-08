import type { SyncOperationType, SyncStatus } from "@prisma/client";
export interface SyncOperationDto {
  operationId: string;
  entityType: "PATIENT" | "ASSESSMENT";
  entityId: string;
  operation: SyncOperationType;
  payload?: Record<string, unknown>;
}
export interface SyncResultDto {
  operationId: string;
  entityId: string;
  status: SyncStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
}
export interface SyncResponseDto {
  processed: number;
  succeeded: number;
  failed: number;
  results: SyncResultDto[];
}
