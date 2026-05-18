ALTER TABLE "Receita" ADD COLUMN "perfilFinanceiroId" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "perfilFinanceiroId" TEXT;
ALTER TABLE "CartaoCredito" ADD COLUMN "perfilFinanceiroId" TEXT;

ALTER TABLE "Receita"
  ADD CONSTRAINT "Receita_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Despesa"
  ADD CONSTRAINT "Despesa_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CartaoCredito"
  ADD CONSTRAINT "CartaoCredito_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "CartaoCredito_usuarioId_nome_key";
CREATE UNIQUE INDEX "CartaoCredito_usuarioId_nome_perfilFinanceiroId_key"
  ON "CartaoCredito"("usuarioId", "nome", "perfilFinanceiroId");
CREATE INDEX "CartaoCredito_usuarioId_perfilFinanceiroId_idx"
  ON "CartaoCredito"("usuarioId", "perfilFinanceiroId");
CREATE INDEX "Receita_usuarioId_perfilFinanceiroId_idx"
  ON "Receita"("usuarioId", "perfilFinanceiroId");
CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_idx"
  ON "Despesa"("usuarioId", "perfilFinanceiroId");
