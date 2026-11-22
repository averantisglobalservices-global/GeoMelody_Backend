/*
  Warnings:

  - The values [PENDING_EMAIL,PROFILE_PENDING,CANCELLED] on the enum `ArtistRegistrationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ArtistRegistrationStatus_new" AS ENUM ('PENDING_VERIFICATION', 'EMAIL_VERIFIED', 'MOBILE_VERIFIED', 'READY_TO_COMPLETE', 'COMPLETED', 'EXPIRED');
ALTER TABLE "public"."ArtistRegistration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ArtistRegistration" ALTER COLUMN "status" TYPE "ArtistRegistrationStatus_new" USING ("status"::text::"ArtistRegistrationStatus_new");
ALTER TYPE "ArtistRegistrationStatus" RENAME TO "ArtistRegistrationStatus_old";
ALTER TYPE "ArtistRegistrationStatus_new" RENAME TO "ArtistRegistrationStatus";
DROP TYPE "public"."ArtistRegistrationStatus_old";
ALTER TABLE "ArtistRegistration" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
COMMIT;

-- AlterTable
ALTER TABLE "ArtistRegistration" ADD COLUMN     "verificationCompletedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ArtistRegistration_verificationCompletedAt_idx" ON "ArtistRegistration"("verificationCompletedAt");
