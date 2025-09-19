/*
  Warnings:

  - Made the column `parcel` on table `Chantier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `section` on table `Chantier` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Chantier" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "parcel" SET NOT NULL,
ALTER COLUMN "section" SET NOT NULL;
