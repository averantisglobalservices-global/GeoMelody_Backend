-- CreateTable
CREATE TABLE "ArtistLoginOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "countryCode" TEXT,
    "mobile" TEXT,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistLoginOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistLoginOtp_email_idx" ON "ArtistLoginOtp"("email");

-- CreateIndex
CREATE INDEX "ArtistLoginOtp_countryCode_mobile_idx" ON "ArtistLoginOtp"("countryCode", "mobile");

-- CreateIndex
CREATE INDEX "ArtistLoginOtp_expiresAt_idx" ON "ArtistLoginOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "ArtistLoginOtp_createdAt_idx" ON "ArtistLoginOtp"("createdAt");
