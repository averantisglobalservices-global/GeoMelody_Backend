-- CreateTable
CREATE TABLE "ArtistProfileVisual" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "artistCoverPicture" TEXT,
    "profilePicture" TEXT,
    "artistLogo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistProfileVisual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistSocialProfile" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "facebook" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "youtube" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistSocialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistSocialProfileOther" (
    "id" TEXT NOT NULL,
    "socialProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistSocialProfileOther_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfileVisual_artistProfileId_key" ON "ArtistProfileVisual"("artistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistSocialProfile_artistProfileId_key" ON "ArtistSocialProfile"("artistProfileId");

-- CreateIndex
CREATE INDEX "ArtistSocialProfileOther_socialProfileId_idx" ON "ArtistSocialProfileOther"("socialProfileId");

-- AddForeignKey
ALTER TABLE "ArtistProfileVisual" ADD CONSTRAINT "ArtistProfileVisual_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSocialProfile" ADD CONSTRAINT "ArtistSocialProfile_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSocialProfileOther" ADD CONSTRAINT "ArtistSocialProfileOther_socialProfileId_fkey" FOREIGN KEY ("socialProfileId") REFERENCES "ArtistSocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
