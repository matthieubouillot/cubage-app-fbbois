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
    "numStart" INTEGER,
    "numEnd" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chantier" (
    "id" TEXT NOT NULL,
    "referenceLot" TEXT NOT NULL,
    "convention" TEXT NOT NULL,
    "proprietaire" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "lieuDit" TEXT NOT NULL,

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Essence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Essence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Qualite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pourcentageEcorce" INTEGER NOT NULL,
    "essenceId" TEXT NOT NULL,

    CONSTRAINT "Qualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EssenceOnChantier" (
    "id" TEXT NOT NULL,
    "essenceId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,

    CONSTRAINT "EssenceOnChantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NumberingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL,

    CONSTRAINT "NumberingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Saisie" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "essenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numero" INTEGER NOT NULL,
    "longueur" DECIMAL(10,2) NOT NULL,
    "diametre" DECIMAL(10,2) NOT NULL,
    "volumeCalc" DECIMAL(12,4) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Saisie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Essence_name_key" ON "public"."Essence"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Qualite_name_essenceId_key" ON "public"."Qualite"("name", "essenceId");

-- CreateIndex
CREATE UNIQUE INDEX "EssenceOnChantier_essenceId_chantierId_key" ON "public"."EssenceOnChantier"("essenceId", "chantierId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_userId_chantierId_key" ON "public"."Assignment"("userId", "chantierId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberingState_userId_chantierId_key" ON "public"."NumberingState"("userId", "chantierId");

-- CreateIndex
CREATE INDEX "Saisie_chantierId_idx" ON "public"."Saisie"("chantierId");

-- CreateIndex
CREATE INDEX "Saisie_userId_idx" ON "public"."Saisie"("userId");

-- CreateIndex
CREATE INDEX "Saisie_essenceId_idx" ON "public"."Saisie"("essenceId");

-- AddForeignKey
ALTER TABLE "public"."Qualite" ADD CONSTRAINT "Qualite_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "public"."Essence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EssenceOnChantier" ADD CONSTRAINT "EssenceOnChantier_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "public"."Essence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EssenceOnChantier" ADD CONSTRAINT "EssenceOnChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NumberingState" ADD CONSTRAINT "NumberingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NumberingState" ADD CONSTRAINT "NumberingState_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "public"."Chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "public"."Essence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Saisie" ADD CONSTRAINT "Saisie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
