-- AlterTable
ALTER TABLE "ArtistType" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ArtistType_status_idx" ON "ArtistType"("status");

-- CreateIndex
CREATE INDEX "ArtistType_deletedAt_idx" ON "ArtistType"("deletedAt");

-- CreateIndex
CREATE INDEX "ArtistType_sortOrder_idx" ON "ArtistType"("sortOrder");
