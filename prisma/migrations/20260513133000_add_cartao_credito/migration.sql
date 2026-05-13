-- Cadastro de cartoes de credito por usuario.
CREATE TABLE "CartaoCredito" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "CartaoCredito_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CartaoCredito_usuarioId_nome_key" ON "CartaoCredito"("usuarioId", "nome");

ALTER TABLE "CartaoCredito"
ADD CONSTRAINT "CartaoCredito_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Liga uma despesa ao cartao quando a forma de pagamento for CARTAO_CREDITO.
ALTER TABLE "Despesa" ADD COLUMN "cartaoCreditoId" TEXT;

ALTER TABLE "Despesa"
ADD CONSTRAINT "Despesa_cartaoCreditoId_fkey"
FOREIGN KEY ("cartaoCreditoId") REFERENCES "CartaoCredito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A opcao DIVIDA deixa de ser usada pela API; registros antigos sao mantidos no banco.
