CREATE TYPE "PhcStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "primary_health_centres"
ADD COLUMN "status" "PhcStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "primary_health_centres_status_idx"
ON "primary_health_centres"("status");
