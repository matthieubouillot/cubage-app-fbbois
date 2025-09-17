/*
  Warnings:

  - A unique constraint covering the columns `[userId,chantierId,qualiteId]` on the table `NumberingState` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `proprietaireFirstName` to the `Chantier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualiteId` to the `NumberingState` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."NumberingState_userId_chantierId_key";

-- AlterTable
ALTER TABLE "public"."Chantier" ADD COLUMN     "proprietaireFirstName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."NumberingState" ADD COLUMN     "qualiteId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "NumberingState_qualiteId_idx" ON "public"."NumberingState"("qualiteId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberingState_userId_chantierId_qualiteId_key" ON "public"."NumberingState"("userId", "chantierId", "qualiteId");

-- AddForeignKey
ALTER TABLE "public"."NumberingState" ADD CONSTRAINT "NumberingState_qualiteId_fkey" FOREIGN KEY ("qualiteId") REFERENCES "public"."Qualite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
