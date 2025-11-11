-- CreateTable
CREATE TABLE "Entreprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_name_key" ON "Entreprise"("name");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

