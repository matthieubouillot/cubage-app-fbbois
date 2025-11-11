-- AlterTable
ALTER TABLE "public"."GPSPoint" ADD COLUMN IF NOT EXISTS "qualityGroupId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'GPSPoint_qualityGroupId_fkey'
  ) THEN
    ALTER TABLE "public"."GPSPoint"
      ADD CONSTRAINT "GPSPoint_qualityGroupId_fkey"
      FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GPSPoint_qualityGroupId_idx" ON "public"."GPSPoint"("qualityGroupId");

