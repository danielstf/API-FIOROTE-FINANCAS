CREATE TYPE "PagamentoTipo" AS ENUM ('CHECKOUT', 'ASSINATURA');

ALTER TABLE "PagamentoPremium"
ADD COLUMN     "mercadoPagoPreapprovalId" TEXT,
ADD COLUMN     "tipo" "PagamentoTipo" NOT NULL DEFAULT 'CHECKOUT',
ADD COLUMN     "assinaturaStatus" TEXT,
ADD COLUMN     "canceladoEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPreapprovalId_key" ON "PagamentoPremium"("mercadoPagoPreapprovalId");
CREATE INDEX "PagamentoPremium_tipo_status_idx" ON "PagamentoPremium"("tipo", "status");
