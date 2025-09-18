/*
  Warnings:

  - Made the column `numStart` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `numEnd` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "numStart" SET NOT NULL,
ALTER COLUMN "numEnd" SET NOT NULL;
