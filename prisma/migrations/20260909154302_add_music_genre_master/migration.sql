/*
  Warnings:

  - You are about to drop the `ArtistType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ArtistType";

-- CreateTable
CREATE TABLE "MusicGenre" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicGenre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicGenre_code_key" ON "MusicGenre"("code");

-- CreateIndex
CREATE INDEX "MusicGenre_status_idx" ON "MusicGenre"("status");

-- CreateIndex
CREATE INDEX "MusicGenre_deletedAt_idx" ON "MusicGenre"("deletedAt");

-- CreateIndex
CREATE INDEX "MusicGenre_sortOrder_idx" ON "MusicGenre"("sortOrder");
