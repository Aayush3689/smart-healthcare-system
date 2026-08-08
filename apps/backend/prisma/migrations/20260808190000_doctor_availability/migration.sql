CREATE TABLE "doctor_availability" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "schedule" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_availability_doctorId_key"
ON "doctor_availability"("doctorId");

ALTER TABLE "doctor_availability"
ADD CONSTRAINT "doctor_availability_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
