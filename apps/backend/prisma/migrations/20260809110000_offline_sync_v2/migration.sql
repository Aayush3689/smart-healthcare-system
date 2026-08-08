ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'CONFLICT';

DROP INDEX IF EXISTS "sync_operations_operationId_key";

ALTER TABLE "sync_operations"
ADD COLUMN "userId" TEXT,
ADD COLUMN "result" JSONB,
ADD COLUMN "clientCreatedAt" TIMESTAMP(3),
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "sync_operations"
SET "clientCreatedAt" = "createdAt"
WHERE "clientCreatedAt" IS NULL;

ALTER TABLE "sync_operations"
ALTER COLUMN "clientCreatedAt" SET NOT NULL;

CREATE UNIQUE INDEX "sync_operations_userId_operationId_key"
ON "sync_operations"("userId", "operationId");

CREATE INDEX "sync_operations_userId_deviceId_status_idx"
ON "sync_operations"("userId", "deviceId", "status");

ALTER TABLE "sync_operations"
ADD CONSTRAINT "sync_operations_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
