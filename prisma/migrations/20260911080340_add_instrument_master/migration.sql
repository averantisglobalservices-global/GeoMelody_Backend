-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruments_code_key" ON "instruments"("code");

-- CreateIndex
CREATE INDEX "instruments_status_idx" ON "instruments"("status");

-- CreateIndex
CREATE INDEX "instruments_deletedAt_idx" ON "instruments"("deletedAt");

-- CreateIndex
CREATE INDEX "instruments_sortOrder_idx" ON "instruments"("sortOrder");
