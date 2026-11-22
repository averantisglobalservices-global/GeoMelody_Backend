/*
  Warnings:

  - A unique constraint covering the columns `[countryCode,mobile]` on the table `ArtistRegistration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[countryCode,mobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ArtistRegistration_mobile_key";

-- DropIndex
DROP INDEX "User_mobile_key";

-- AlterTable
ALTER TABLE "ArtistRegistration" ADD COLUMN     "countryCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countryCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ArtistRegistration_countryCode_mobile_key" ON "ArtistRegistration"("countryCode", "mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_countryCode_mobile_key" ON "User"("countryCode", "mobile");
