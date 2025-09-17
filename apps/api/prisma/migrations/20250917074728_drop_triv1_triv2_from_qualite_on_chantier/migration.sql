/*
  Warnings:

  - You are about to drop the column `triV1` on the `QualiteOnChantier` table. All the data in the column will be lost.
  - You are about to drop the column `triV2` on the `QualiteOnChantier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."QualiteOnChantier" DROP COLUMN "triV1",
DROP COLUMN "triV2";
