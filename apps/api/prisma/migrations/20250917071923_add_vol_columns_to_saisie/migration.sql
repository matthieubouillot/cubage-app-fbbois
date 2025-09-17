/*
  Warnings:

  - Added the required column `qualiteId` to the `Saisie` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Saisie" ADD COLUMN     "annotation" TEXT,
ADD COLUMN     "qualiteId" TEXT NOT NULL,
ADD COLUMN     "volBetweenV1V2" DECIMAL(12,4),
ADD COLUMN     "volGeV2" DECIMAL(12,4),
ADD COLUMN     "volLtV1" DECIMAL(12,4);

-- CreateIndex
CREATE INDEX "Saisie_qualiteId_idx" ON "public"."Saisie"("qualiteId");

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_qualiteId_fkey" FOREIGN KEY ("qualiteId") REFERENCES "public"."Qualite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
