-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'Role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."Role" AS ENUM ('SUPERVISEUR', 'BUCHERON', 'DEBARDEUR');
  END IF;
END $$;

-- CreateTable
CREATE TABLE "public"."Entreprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "numStart" INTEGER NOT NULL,
    "numEnd" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT,
    "roles" "public"."Role"[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" TEXT NOT NULL,
    "commune" TEXT,
    "lieuDit" TEXT,
    "section" VARCHAR(2),
    "parcelle" TEXT,
    "surfaceCadastrale" DECIMAL(10,3),
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Essence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Essence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Qualite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Qualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scieur" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scieur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityGroup" (
    "id" TEXT NOT NULL,
    "quality_group_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualiteId" TEXT NOT NULL,
    "scieurId" TEXT NOT NULL,
    "pourcentageEcorce" INTEGER NOT NULL,

    CONSTRAINT "QualityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityGroupEssence" (
    "id" TEXT NOT NULL,
    "essenceId" TEXT NOT NULL,
    "qualityGroupId" TEXT NOT NULL,

    CONSTRAINT "QualityGroupEssence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LotConvention" (
    "id" TEXT NOT NULL,
    "lot" TEXT NOT NULL,
    "convention" TEXT NOT NULL,
    "qualityGroupId" TEXT NOT NULL,

    CONSTRAINT "LotConvention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chantier" (
    "id" TEXT NOT NULL,
    "numeroCoupe" TEXT NOT NULL,
    "section" VARCHAR(2),
    "parcel" TEXT,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChantierQualityGroup" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "qualityGroupId" TEXT NOT NULL,

    CONSTRAINT "ChantierQualityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Saisie" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "qualityGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numero" INTEGER NOT NULL,
    "longueur" DECIMAL(10,2) NOT NULL,
    "diametre" DECIMAL(10,2) NOT NULL,
    "volumeCalc" DECIMAL(12,4) NOT NULL,
    "volLtV1" DECIMAL(12,4),
    "volBetweenV1V2" DECIMAL(12,4),
    "volGeV2" DECIMAL(12,4),
    "annotation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "debardeurId" TEXT,

    CONSTRAINT "Saisie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GPSPoint" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "chantierId" TEXT NOT NULL,
    "qualityGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GPSPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebardeurAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebardeurAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChantierFiche" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "aFacturerValues" JSONB NOT NULL,
    "fraisGestionValues" JSONB NOT NULL,
    "prixUHT" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChantierFiche_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_name_key" ON "public"."Entreprise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "public"."User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "public"."PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client"("email");

-- CreateIndex
CREATE INDEX "Property_clientId_idx" ON "public"."Property"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Essence_name_key" ON "public"."Essence"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Qualite_name_key" ON "public"."Qualite"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scieur_name_key" ON "public"."Scieur"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QualityGroup_name_unique" ON "public"."QualityGroup"("quality_group_name");

-- CreateIndex
CREATE UNIQUE INDEX "QualityGroupEssence_essenceId_qualityGroupId_key" ON "public"."QualityGroupEssence"("essenceId", "qualityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "LotConvention_qualityGroupId_key" ON "public"."LotConvention"("qualityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Chantier_numeroCoupe_key" ON "public"."Chantier"("numeroCoupe");

-- CreateIndex
CREATE INDEX "Chantier_propertyId_idx" ON "public"."Chantier"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChantierQualityGroup_chantierId_qualityGroupId_key" ON "public"."ChantierQualityGroup"("chantierId", "qualityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_userId_chantierId_key" ON "public"."Assignment"("userId", "chantierId");

-- CreateIndex
CREATE INDEX "Saisie_chantierId_idx" ON "public"."Saisie"("chantierId");

-- CreateIndex
CREATE INDEX "Saisie_userId_idx" ON "public"."Saisie"("userId");

-- CreateIndex
CREATE INDEX "Saisie_qualityGroupId_idx" ON "public"."Saisie"("qualityGroupId");

-- CreateIndex
CREATE INDEX "Saisie_debardeurId_idx" ON "public"."Saisie"("debardeurId");

-- CreateIndex
CREATE INDEX "GPSPoint_chantierId_idx" ON "public"."GPSPoint"("chantierId");

-- CreateIndex
CREATE INDEX "GPSPoint_qualityGroupId_idx" ON "public"."GPSPoint"("qualityGroupId");

-- CreateIndex
CREATE INDEX "DebardeurAssignment_chantierId_idx" ON "public"."DebardeurAssignment"("chantierId");

-- CreateIndex
CREATE UNIQUE INDEX "DebardeurAssignment_userId_chantierId_key" ON "public"."DebardeurAssignment"("userId", "chantierId");

-- CreateIndex
CREATE UNIQUE INDEX "ChantierFiche_chantierId_key" ON "public"."ChantierFiche"("chantierId");

-- CreateIndex
CREATE INDEX "ChantierFiche_chantierId_idx" ON "public"."ChantierFiche"("chantierId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityGroup" ADD CONSTRAINT "QualityGroup_qualiteId_fkey" FOREIGN KEY ("qualiteId") REFERENCES "public"."Qualite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityGroup" ADD CONSTRAINT "QualityGroup_scieurId_fkey" FOREIGN KEY ("scieurId") REFERENCES "public"."Scieur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityGroupEssence" ADD CONSTRAINT "QualityGroupEssence_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "public"."Essence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityGroupEssence" ADD CONSTRAINT "QualityGroupEssence_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LotConvention" ADD CONSTRAINT "LotConvention_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chantier" ADD CONSTRAINT "Chantier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chantier" ADD CONSTRAINT "Chantier_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChantierQualityGroup" ADD CONSTRAINT "ChantierQualityGroup_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChantierQualityGroup" ADD CONSTRAINT "ChantierQualityGroup_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_debardeurId_fkey" FOREIGN KEY ("debardeurId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GPSPoint" ADD CONSTRAINT "GPSPoint_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GPSPoint" ADD CONSTRAINT "GPSPoint_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebardeurAssignment" ADD CONSTRAINT "DebardeurAssignment_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebardeurAssignment" ADD CONSTRAINT "DebardeurAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChantierFiche" ADD CONSTRAINT "ChantierFiche_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

