ALTER TABLE "Receita" ADD COLUMN "recorrenciaFim" TIMESTAMP(3);
ALTER TABLE "Despesa" ADD COLUMN "recorrenciaFim" TIMESTAMP(3);

CREATE TABLE "ReceitaExcecaoRecorrencia" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "receitaId" TEXT NOT NULL,
  "mesReferencia" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReceitaExcecaoRecorrencia_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReceitaExcecaoRecorrencia"
  ADD CONSTRAINT "ReceitaExcecaoRecorrencia_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReceitaExcecaoRecorrencia"
  ADD CONSTRAINT "ReceitaExcecaoRecorrencia_receitaId_fkey"
  FOREIGN KEY ("receitaId") REFERENCES "Receita"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ReceitaExcecaoRecorrencia_receitaId_usuarioId_mesReferencia_key"
  ON "ReceitaExcecaoRecorrencia"("receitaId", "usuarioId", "mesReferencia");

CREATE INDEX "ReceitaExcecaoRecorrencia_usuarioId_mesReferencia_idx"
  ON "ReceitaExcecaoRecorrencia"("usuarioId", "mesReferencia");
