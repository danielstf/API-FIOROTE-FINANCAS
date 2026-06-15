-- Soft delete em CartaoCredito: preserva historico de despesas vinculadas.
-- O campo deletedAt nulo = ativo; preenchido = excluido logicamente.

ALTER TABLE "CartaoCredito" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Remove a restricao de unicidade do banco; agora e garantida na camada de
-- aplicacao filtrando apenas cartoes ativos (deletedAt IS NULL), o que
-- permite recriar um cartao com o mesmo nome apos exclui-lo.
DROP INDEX IF EXISTS "CartaoCredito_usuarioId_nome_perfilFinanceiroId_key";

-- Indice composto para queries de listagem/busca de cartoes ativos.
CREATE INDEX "CartaoCredito_usuarioId_perfilFinanceiroId_deletedAt_idx"
  ON "CartaoCredito"("usuarioId", "perfilFinanceiroId", "deletedAt");
