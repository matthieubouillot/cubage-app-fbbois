-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."Entreprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Entreprise_name_key" ON "public"."Entreprise"("name");

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "public"."User"("companyId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_companyId_fkey'
      AND conrelid = 'public."User"'::regclass
  ) THEN
    ALTER TABLE "public"."User"
      ADD CONSTRAINT "User_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "public"."Entreprise"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
