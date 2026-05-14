CREATE TABLE "DespesaExcecaoRecorrencia" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "despesaId" TEXT NOT NULL,
  "mesReferencia" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DespesaExcecaoRecorrencia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DespesaExcecaoRecorrencia_despesaId_usuarioId_mesReferencia_key"
ON "DespesaExcecaoRecorrencia"("despesaId", "usuarioId", "mesReferencia");

CREATE INDEX "DespesaExcecaoRecorrencia_usuarioId_mesReferencia_idx"
ON "DespesaExcecaoRecorrencia"("usuarioId", "mesReferencia");

ALTER TABLE "DespesaExcecaoRecorrencia"
ADD CONSTRAINT "DespesaExcecaoRecorrencia_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DespesaExcecaoRecorrencia"
ADD CONSTRAINT "DespesaExcecaoRecorrencia_despesaId_fkey"
FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
