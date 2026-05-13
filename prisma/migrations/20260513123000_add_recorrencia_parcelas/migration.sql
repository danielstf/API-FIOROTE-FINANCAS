-- Campos para receitas fixas e parceladas.
ALTER TABLE "Receita"
ADD COLUMN "fixa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "numeroParcelas" INTEGER,
ADD COLUMN "parcelaAtual" INTEGER,
ADD COLUMN "parcelamentoId" TEXT;

-- Campos para despesas fixas, parceladas e mes de referencia.
ALTER TABLE "Despesa"
ADD COLUMN "mesReferencia" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
ADD COLUMN "fixa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "numeroParcelas" INTEGER,
ADD COLUMN "parcelaAtual" INTEGER,
ADD COLUMN "parcelamentoId" TEXT;

-- Para despesas antigas, usa o vencimento como referencia quando existir.
UPDATE "Despesa"
SET "mesReferencia" = DATE_TRUNC('month', COALESCE("dataVencimento", "criadoEm"));
