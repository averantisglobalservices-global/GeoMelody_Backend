/*
  Warnings:

  - You are about to drop the column `billingCycle` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `SubscriptionPlan` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - Added the required column `billingPeriod` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionBillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- DropIndex
DROP INDEX "SubscriptionPlan_billingCycle_idx";

-- DropIndex
DROP INDEX "SubscriptionPlan_createdAt_idx";

-- DropIndex
DROP INDEX "SubscriptionPlan_isSystem_idx";

-- DropIndex
DROP INDEX "SubscriptionPlan_sortOrder_idx";

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "billingCycle",
DROP COLUMN "sortOrder",
ADD COLUMN     "billingPeriod" "SubscriptionBillingPeriod" NOT NULL,
ALTER COLUMN "price" DROP DEFAULT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "SubscriptionPlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPlanFeature_planId_idx" ON "SubscriptionPlanFeature"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanFeature_status_idx" ON "SubscriptionPlanFeature"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanFeature_planId_name_key" ON "SubscriptionPlanFeature"("planId", "name");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_billingPeriod_idx" ON "SubscriptionPlan"("billingPeriod");

-- AddForeignKey
ALTER TABLE "SubscriptionPlanFeature" ADD CONSTRAINT "SubscriptionPlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
