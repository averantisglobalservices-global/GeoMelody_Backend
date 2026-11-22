/*
  Warnings:

  - You are about to alter the column `profileCompletionPercentage` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- CreateEnum
CREATE TYPE "ArtistType" AS ENUM ('SOLO_ARTIST', 'MUSIC_BAND');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "profileCompletionPercentage" SET DEFAULT 0,
ALTER COLUMN "profileCompletionPercentage" SET DATA TYPE DECIMAL(5,2);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistType" "ArtistType" NOT NULL,
    "stageName" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfileGenre" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistProfileGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandMember" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BandMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");

-- CreateIndex
CREATE INDEX "ArtistProfile_artistType_idx" ON "ArtistProfile"("artistType");

-- CreateIndex
CREATE INDEX "ArtistProfileGenre_artistProfileId_idx" ON "ArtistProfileGenre"("artistProfileId");

-- CreateIndex
CREATE INDEX "ArtistProfileGenre_genreId_idx" ON "ArtistProfileGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfileGenre_artistProfileId_genreId_key" ON "ArtistProfileGenre"("artistProfileId", "genreId");

-- CreateIndex
CREATE INDEX "BandMember_artistProfileId_idx" ON "BandMember"("artistProfileId");

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfileGenre" ADD CONSTRAINT "ArtistProfileGenre_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfileGenre" ADD CONSTRAINT "ArtistProfileGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "MusicGenre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
