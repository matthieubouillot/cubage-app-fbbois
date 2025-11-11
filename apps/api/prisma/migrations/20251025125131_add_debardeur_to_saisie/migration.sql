-- Add debardeurId column to Saisie table
ALTER TABLE "Saisie" ADD COLUMN "debardeurId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Saisie" ADD CONSTRAINT "Saisie_debardeurId_fkey" FOREIGN KEY ("debardeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX "Saisie_debardeurId_idx" ON "Saisie"("debardeurId");
