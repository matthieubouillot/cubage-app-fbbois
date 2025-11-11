-- CreateTable
CREATE TABLE "Property" (
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

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Property_clientId_idx" ON "Property"("clientId");

-- Drop the old properties column from Client
ALTER TABLE "Client" DROP COLUMN "properties";

