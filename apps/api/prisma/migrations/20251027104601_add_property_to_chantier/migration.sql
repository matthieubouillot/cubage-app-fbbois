-- AlterTable
ALTER TABLE "Chantier" ADD COLUMN "propertyId" TEXT;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Chantier_propertyId_idx" ON "Chantier"("propertyId");

-- AlterTable: Make section and parcel optional (nullable)
ALTER TABLE "Chantier" ALTER COLUMN "section" DROP NOT NULL;
ALTER TABLE "Chantier" ALTER COLUMN "parcel" DROP NOT NULL;

