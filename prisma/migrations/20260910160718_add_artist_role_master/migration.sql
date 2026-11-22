-- CreateTable
CREATE TABLE "ArtistRole" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistRole_code_key" ON "ArtistRole"("code");

-- CreateIndex
CREATE INDEX "ArtistRole_status_idx" ON "ArtistRole"("status");

-- CreateIndex
CREATE INDEX "ArtistRole_deletedAt_idx" ON "ArtistRole"("deletedAt");

-- CreateIndex
CREATE INDEX "ArtistRole_sortOrder_idx" ON "ArtistRole"("sortOrder");
