ALTER TABLE "Receita" DROP CONSTRAINT IF EXISTS "Receita_perfilFinanceiroId_fkey";
ALTER TABLE "Despesa" DROP CONSTRAINT IF EXISTS "Despesa_perfilFinanceiroId_fkey";
ALTER TABLE "CartaoCredito" DROP CONSTRAINT IF EXISTS "CartaoCredito_perfilFinanceiroId_fkey";

ALTER TABLE "Receita"
  ADD CONSTRAINT "Receita_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Despesa"
  ADD CONSTRAINT "Despesa_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartaoCredito"
  ADD CONSTRAINT "CartaoCredito_perfilFinanceiroId_fkey"
  FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
