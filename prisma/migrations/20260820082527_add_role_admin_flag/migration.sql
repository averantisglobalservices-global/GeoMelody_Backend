-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Role_isAdmin_idx" ON "Role"("isAdmin");
