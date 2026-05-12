-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PagamentoPremium" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "externalReference" TEXT NOT NULL,
    "status" "PagamentoStatus" NOT NULL DEFAULT 'PENDING',
    "valor" DECIMAL(10,2) NOT NULL,
    "checkoutUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoPremium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPreferenceId_key" ON "PagamentoPremium"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPaymentId_key" ON "PagamentoPremium"("mercadoPagoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_externalReference_key" ON "PagamentoPremium"("externalReference");

-- AddForeignKey
ALTER TABLE "PagamentoPremium" ADD CONSTRAINT "PagamentoPremium_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
