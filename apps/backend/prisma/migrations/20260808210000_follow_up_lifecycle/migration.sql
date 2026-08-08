ALTER TYPE "FollowUpStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';
ALTER TYPE "FollowUpStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

ALTER TABLE "follow_ups"
ADD COLUMN "clinicalNoteId" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "priority" "ReferralPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "visited" BOOLEAN;

CREATE INDEX "follow_ups_doctorId_idx" ON "follow_ups"("doctorId");
CREATE INDEX "follow_ups_clinicalNoteId_idx" ON "follow_ups"("clinicalNoteId");

ALTER TABLE "follow_ups"
ADD CONSTRAINT "follow_ups_clinicalNoteId_fkey"
FOREIGN KEY ("clinicalNoteId") REFERENCES "clinical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assessments" ADD COLUMN "followUpId" TEXT;
CREATE INDEX "assessments_followUpId_idx" ON "assessments"("followUpId");
ALTER TABLE "assessments"
ADD CONSTRAINT "assessments_followUpId_fkey"
FOREIGN KEY ("followUpId") REFERENCES "follow_ups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "follow_up_history" (
  "id" TEXT NOT NULL,
  "followUpId" TEXT NOT NULL,
  "status" "FollowUpStatus" NOT NULL,
  "changedById" TEXT NOT NULL,
  "reason" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follow_up_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "follow_up_history_followUpId_createdAt_idx"
ON "follow_up_history"("followUpId", "createdAt");

ALTER TABLE "follow_up_history"
ADD CONSTRAINT "follow_up_history_followUpId_fkey"
FOREIGN KEY ("followUpId") REFERENCES "follow_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "follow_up_history"
ADD CONSTRAINT "follow_up_history_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
