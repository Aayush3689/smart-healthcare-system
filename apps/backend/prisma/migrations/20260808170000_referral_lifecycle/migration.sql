ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

CREATE TABLE "referral_history" (
  "id" TEXT NOT NULL,
  "referralId" TEXT NOT NULL,
  "status" "ReferralStatus" NOT NULL,
  "changedById" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referral_history_referralId_createdAt_idx"
ON "referral_history"("referralId", "createdAt");

CREATE UNIQUE INDEX "referrals_assessmentId_predictionId_key"
ON "referrals"("assessmentId", "predictionId");

ALTER TABLE "referral_history"
ADD CONSTRAINT "referral_history_referralId_fkey"
FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_history"
ADD CONSTRAINT "referral_history_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
