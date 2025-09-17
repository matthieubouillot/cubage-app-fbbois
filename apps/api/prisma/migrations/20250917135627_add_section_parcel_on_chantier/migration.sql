/*
  Warnings:

  - You are about to alter the column `section` on the `Chantier` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2)`.

*/
-- AlterTable
ALTER TABLE "public"."Chantier" ALTER COLUMN "section" SET DATA TYPE VARCHAR(2);
