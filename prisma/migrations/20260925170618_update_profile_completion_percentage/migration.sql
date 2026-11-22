/*
  Warnings:

  - You are about to alter the column `profileCompletionPercentage` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profileCompletionPercentage" SET DEFAULT 25,
ALTER COLUMN "profileCompletionPercentage" SET DATA TYPE DOUBLE PRECISION;
