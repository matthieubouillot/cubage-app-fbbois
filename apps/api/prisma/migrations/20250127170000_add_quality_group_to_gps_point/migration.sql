-- AlterTable
ALTER TABLE "GPSPoint" ADD COLUMN "qualityGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "GPSPoint" ADD CONSTRAINT "GPSPoint_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "QualityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "GPSPoint_qualityGroupId_idx" ON "GPSPoint"("qualityGroupId");
