-- Forma usada para classificar e filtrar despesas.
CREATE TYPE "FormaPagamentoDespesa" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'DIVIDA');

-- Categoria textual simples para o cadastro e forma de pagamento para filtros.
ALTER TABLE "Despesa"
ADD COLUMN "categoriaNome" TEXT,
ADD COLUMN "formaPagamento" "FormaPagamentoDespesa" NOT NULL DEFAULT 'DINHEIRO',
ALTER COLUMN "dataVencimento" DROP NOT NULL;
