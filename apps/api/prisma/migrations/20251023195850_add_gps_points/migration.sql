-- CreateTable
CREATE TABLE "public"."GPSPoint" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "chantierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GPSPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GPSPoint_chantierId_idx" ON "public"."GPSPoint"("chantierId");

-- AddForeignKey
ALTER TABLE "public"."GPSPoint" ADD CONSTRAINT "GPSPoint_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
