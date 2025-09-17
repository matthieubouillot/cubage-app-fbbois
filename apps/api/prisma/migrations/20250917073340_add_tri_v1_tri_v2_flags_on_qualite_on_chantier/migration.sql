-- AlterTable
ALTER TABLE "public"."QualiteOnChantier" ADD COLUMN     "circonf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triV1" DECIMAL(12,3),
ADD COLUMN     "triV2" DECIMAL(12,3);
