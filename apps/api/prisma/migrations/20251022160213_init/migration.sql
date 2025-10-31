-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERVISEUR', 'BUCHERON');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "numStart" INTEGER NOT NULL,
    "numEnd" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "properties" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
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
    "section" VARCHAR(2) NOT NULL,
    "parcel" TEXT NOT NULL,
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

    CONSTRAINT "Saisie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "public"."PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "public"."PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "public"."Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Essence_name_key" ON "public"."Essence"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Qualite_name_key" ON "public"."Qualite"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scieur_name_key" ON "public"."Scieur"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QualityGroup_quality_group_name_key" ON "public"."QualityGroup"("quality_group_name");

-- CreateIndex
CREATE UNIQUE INDEX "QualityGroup_name_unique" ON "public"."QualityGroup"("quality_group_name");

-- CreateIndex
CREATE UNIQUE INDEX "QualityGroupEssence_essenceId_qualityGroupId_key" ON "public"."QualityGroupEssence"("essenceId", "qualityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "LotConvention_qualityGroupId_key" ON "public"."LotConvention"("qualityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Chantier_numeroCoupe_key" ON "public"."Chantier"("numeroCoupe");

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

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "public"."ChantierQualityGroup" ADD CONSTRAINT "ChantierQualityGroup_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChantierQualityGroup" ADD CONSTRAINT "ChantierQualityGroup_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_qualityGroupId_fkey" FOREIGN KEY ("qualityGroupId") REFERENCES "public"."QualityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
