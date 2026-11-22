-- CreateTable
CREATE TABLE "ArtistProfileRole" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "artistRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistProfileRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfileInstrument" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistProfileInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtistProfileRole_artistProfileId_idx" ON "ArtistProfileRole"("artistProfileId");

-- CreateIndex
CREATE INDEX "ArtistProfileRole_artistRoleId_idx" ON "ArtistProfileRole"("artistRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfileRole_artistProfileId_artistRoleId_key" ON "ArtistProfileRole"("artistProfileId", "artistRoleId");

-- CreateIndex
CREATE INDEX "ArtistProfileInstrument_artistProfileId_idx" ON "ArtistProfileInstrument"("artistProfileId");

-- CreateIndex
CREATE INDEX "ArtistProfileInstrument_instrumentId_idx" ON "ArtistProfileInstrument"("instrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfileInstrument_artistProfileId_instrumentId_key" ON "ArtistProfileInstrument"("artistProfileId", "instrumentId");

-- AddForeignKey
ALTER TABLE "ArtistProfileRole" ADD CONSTRAINT "ArtistProfileRole_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfileRole" ADD CONSTRAINT "ArtistProfileRole_artistRoleId_fkey" FOREIGN KEY ("artistRoleId") REFERENCES "ArtistRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfileInstrument" ADD CONSTRAINT "ArtistProfileInstrument_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfileInstrument" ADD CONSTRAINT "ArtistProfileInstrument_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
