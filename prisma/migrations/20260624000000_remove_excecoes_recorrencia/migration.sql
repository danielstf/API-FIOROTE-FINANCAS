-- DropTable
DROP TABLE "ReceitaExcecaoRecorrencia";

-- DropTable
DROP TABLE "DespesaExcecaoRecorrencia";

-- AlterTable
ALTER TABLE "Receita" DROP COLUMN "recorrenciaFim",
DROP COLUMN "recorrenciaEncerrada";

-- AlterTable
ALTER TABLE "Despesa" DROP COLUMN "recorrenciaFim",
DROP COLUMN "recorrenciaEncerrada";
