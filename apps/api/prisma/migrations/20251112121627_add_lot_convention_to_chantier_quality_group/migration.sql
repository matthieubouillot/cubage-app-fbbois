-- AlterTable: Ajouter lot et convention à ChantierQualityGroup
ALTER TABLE "ChantierQualityGroup" ADD COLUMN "lot" TEXT;
ALTER TABLE "ChantierQualityGroup" ADD COLUMN "convention" TEXT;

-- DropTable: Supprimer LotConvention si elle existe
DROP TABLE IF EXISTS "LotConvention";

