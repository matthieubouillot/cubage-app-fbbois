-- Add DEBARDEUR to existing Role enum
ALTER TYPE "Role" ADD VALUE 'DEBARDEUR';

-- Add new roles column as text array first
ALTER TABLE "User" ADD COLUMN "roles" TEXT[];

-- Migrate existing data: convert single role to array
UPDATE "User" SET "roles" = ARRAY["role"]::TEXT[];

-- Make roles NOT NULL
ALTER TABLE "User" ALTER COLUMN "roles" SET NOT NULL;

-- Change roles column to use Role enum array
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "Role"[] USING "roles"::"Role"[];

-- Drop old role column
ALTER TABLE "User" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "DebardeurAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebardeurAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebardeurAssignment_userId_chantierId_key" ON "DebardeurAssignment"("userId", "chantierId");

-- CreateIndex
CREATE INDEX "DebardeurAssignment_chantierId_idx" ON "DebardeurAssignment"("chantierId");

-- AddForeignKey
ALTER TABLE "DebardeurAssignment" ADD CONSTRAINT "DebardeurAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebardeurAssignment" ADD CONSTRAINT "DebardeurAssignment_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
