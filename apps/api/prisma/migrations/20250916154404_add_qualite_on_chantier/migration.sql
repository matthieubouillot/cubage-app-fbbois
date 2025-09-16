-- CreateTable
CREATE TABLE "public"."QualiteOnChantier" (
    "id" TEXT NOT NULL,
    "qualiteId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,

    CONSTRAINT "QualiteOnChantier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualiteOnChantier_qualiteId_chantierId_key" ON "public"."QualiteOnChantier"("qualiteId", "chantierId");

-- AddForeignKey
ALTER TABLE "public"."QualiteOnChantier" ADD CONSTRAINT "QualiteOnChantier_qualiteId_fkey" FOREIGN KEY ("qualiteId") REFERENCES "public"."Qualite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualiteOnChantier" ADD CONSTRAINT "QualiteOnChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
