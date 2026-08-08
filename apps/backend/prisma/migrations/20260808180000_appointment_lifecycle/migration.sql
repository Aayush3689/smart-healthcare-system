ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';

ALTER TABLE "appointments"
ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "appointment_history" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "status" "AppointmentStatus" NOT NULL,
  "changedById" TEXT NOT NULL,
  "reason" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_history_appointmentId_createdAt_idx"
ON "appointment_history"("appointmentId", "createdAt");

ALTER TABLE "appointment_history"
ADD CONSTRAINT "appointment_history_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_history"
ADD CONSTRAINT "appointment_history_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
