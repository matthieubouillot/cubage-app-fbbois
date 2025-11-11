-- Add debardeurId column to Saisie table
ALTER TABLE "public"."Saisie" ADD COLUMN IF NOT EXISTS "debardeurId" TEXT;

-- Add foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Saisie_debardeurId_fkey'
      AND conrelid = 'public."Saisie"'::regclass
  ) THEN
    ALTER TABLE "public"."Saisie"
      ADD CONSTRAINT "Saisie_debardeurId_fkey"
      FOREIGN KEY ("debardeurId") REFERENCES "public"."User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS "Saisie_debardeurId_idx" ON "public"."Saisie"("debardeurId");
