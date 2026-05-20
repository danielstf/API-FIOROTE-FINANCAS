CREATE INDEX "PagamentoPremium_usuarioId_criadoEm_idx"
ON "PagamentoPremium"("usuarioId", "criadoEm");

CREATE INDEX "PagamentoPremium_status_criadoEm_idx"
ON "PagamentoPremium"("status", "criadoEm");

CREATE INDEX "Receita_usuarioId_perfilFinanceiroId_data_idx"
ON "Receita"("usuarioId", "perfilFinanceiroId", "data");

CREATE INDEX "Receita_usuarioId_perfilFinanceiroId_fixa_data_idx"
ON "Receita"("usuarioId", "perfilFinanceiroId", "fixa", "data");

CREATE INDEX "Receita_parcelamentoId_usuarioId_idx"
ON "Receita"("parcelamentoId", "usuarioId");

CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_mesReferencia_idx"
ON "Despesa"("usuarioId", "perfilFinanceiroId", "mesReferencia");

CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_fixa_mesReferencia_idx"
ON "Despesa"("usuarioId", "perfilFinanceiroId", "fixa", "mesReferencia");

CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_paga_dataVencimento_idx"
ON "Despesa"("usuarioId", "perfilFinanceiroId", "paga", "dataVencimento");

CREATE INDEX "Despesa_cartaoCreditoId_usuarioId_idx"
ON "Despesa"("cartaoCreditoId", "usuarioId");

CREATE INDEX "Despesa_parcelamentoId_usuarioId_idx"
ON "Despesa"("parcelamentoId", "usuarioId");
