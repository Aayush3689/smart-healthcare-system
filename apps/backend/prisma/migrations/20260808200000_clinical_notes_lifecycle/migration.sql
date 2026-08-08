CREATE TYPE "ClinicalNoteStatus" AS ENUM ('DRAFT', 'FINAL');

ALTER TABLE "clinical_notes"
ALTER COLUMN "content" DROP NOT NULL,
ADD COLUMN "observations" TEXT,
ADD COLUMN "clinicalImpression" TEXT,
ADD COLUMN "diagnosis" TEXT,
ADD COLUMN "treatmentPlan" TEXT,
ADD COLUMN "advice" TEXT,
ADD COLUMN "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "followUpAfterDays" INTEGER,
ADD COLUMN "status" "ClinicalNoteStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "finalizedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "clinical_notes_appointmentId_key"
ON "clinical_notes"("appointmentId");

CREATE TABLE "clinical_medications" (
  "id" TEXT NOT NULL,
  "clinicalNoteId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "instructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_medications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clinical_medications_clinicalNoteId_idx"
ON "clinical_medications"("clinicalNoteId");

ALTER TABLE "clinical_medications"
ADD CONSTRAINT "clinical_medications_clinicalNoteId_fkey"
FOREIGN KEY ("clinicalNoteId") REFERENCES "clinical_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
