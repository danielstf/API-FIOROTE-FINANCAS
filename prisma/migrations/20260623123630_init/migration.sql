-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PagamentoTipo" AS ENUM ('CHECKOUT', 'ASSINATURA');

-- CreateEnum
CREATE TYPE "FormaPagamentoDespesa" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO', 'BOLETO');

-- CreateEnum
CREATE TYPE "SugestaoTipo" AS ENUM ('RECLAMACAO', 'ELOGIO', 'SUGESTAO', 'OUTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "googleId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plano" "Plano" NOT NULL DEFAULT 'FREE',
    "premiumExpiraEm" TIMESTAMP(3),
    "exibirAnuncios" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoUsuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" TIMESTAMP(3) NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilFinanceiro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT 'user',
    "tema" TEXT NOT NULL DEFAULT 'system',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "PerfilFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoPremium" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPreapprovalId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "externalReference" TEXT NOT NULL,
    "tipo" "PagamentoTipo" NOT NULL DEFAULT 'CHECKOUT',
    "status" "PagamentoStatus" NOT NULL DEFAULT 'PENDING',
    "assinaturaStatus" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "checkoutUrl" TEXT,
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoPremium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receita" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "fixa" BOOLEAN NOT NULL DEFAULT false,
    "recorrenciaFim" TIMESTAMP(3),
    "recorrenciaEncerrada" BOOLEAN NOT NULL DEFAULT false,
    "numeroParcelas" INTEGER,
    "parcelaAtual" INTEGER,
    "parcelamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "perfilFinanceiroId" TEXT,
    "categoriaId" TEXT,

    CONSTRAINT "Receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaExcecaoRecorrencia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "receitaId" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceitaExcecaoRecorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoriaNome" TEXT,
    "formaPagamento" "FormaPagamentoDespesa" NOT NULL DEFAULT 'DINHEIRO',
    "cartaoCreditoId" TEXT,
    "mesReferencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "fixa" BOOLEAN NOT NULL DEFAULT false,
    "recorrenciaFim" TIMESTAMP(3),
    "recorrenciaEncerrada" BOOLEAN NOT NULL DEFAULT false,
    "numeroParcelas" INTEGER,
    "parcelaAtual" INTEGER,
    "parcelamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "perfilFinanceiroId" TEXT,
    "categoriaId" TEXT,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaExcecaoRecorrencia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DespesaExcecaoRecorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoCredito" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,
    "perfilFinanceiroId" TEXT,

    CONSTRAINT "CartaoCredito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sugestao" (
    "id" TEXT NOT NULL,
    "tipo" "SugestaoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Sugestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContatoSuporte" (
    "id" TEXT NOT NULL,
    "tipo" "SugestaoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContatoSuporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoCategoria" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- CreateIndex
CREATE INDEX "SessaoUsuario_usuarioId_idx" ON "SessaoUsuario"("usuarioId");

-- CreateIndex
CREATE INDEX "SessaoUsuario_atualizadaEm_idx" ON "SessaoUsuario"("atualizadaEm");

-- CreateIndex
CREATE INDEX "SessaoUsuario_expiraEm_idx" ON "SessaoUsuario"("expiraEm");

-- CreateIndex
CREATE INDEX "PerfilFinanceiro_usuarioId_criadoEm_idx" ON "PerfilFinanceiro"("usuarioId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilFinanceiro_usuarioId_nome_key" ON "PerfilFinanceiro"("usuarioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPreferenceId_key" ON "PagamentoPremium"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPreapprovalId_key" ON "PagamentoPremium"("mercadoPagoPreapprovalId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_mercadoPagoPaymentId_key" ON "PagamentoPremium"("mercadoPagoPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoPremium_externalReference_key" ON "PagamentoPremium"("externalReference");

-- CreateIndex
CREATE INDEX "PagamentoPremium_usuarioId_criadoEm_idx" ON "PagamentoPremium"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "PagamentoPremium_status_criadoEm_idx" ON "PagamentoPremium"("status", "criadoEm");

-- CreateIndex
CREATE INDEX "PagamentoPremium_tipo_status_idx" ON "PagamentoPremium"("tipo", "status");

-- CreateIndex
CREATE INDEX "Receita_usuarioId_perfilFinanceiroId_data_idx" ON "Receita"("usuarioId", "perfilFinanceiroId", "data");

-- CreateIndex
CREATE INDEX "Receita_usuarioId_perfilFinanceiroId_fixa_data_idx" ON "Receita"("usuarioId", "perfilFinanceiroId", "fixa", "data");

-- CreateIndex
CREATE INDEX "Receita_parcelamentoId_usuarioId_idx" ON "Receita"("parcelamentoId", "usuarioId");

-- CreateIndex
CREATE INDEX "ReceitaExcecaoRecorrencia_usuarioId_mesReferencia_idx" ON "ReceitaExcecaoRecorrencia"("usuarioId", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "ReceitaExcecaoRecorrencia_receitaId_usuarioId_mesReferencia_key" ON "ReceitaExcecaoRecorrencia"("receitaId", "usuarioId", "mesReferencia");

-- CreateIndex
CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_mesReferencia_idx" ON "Despesa"("usuarioId", "perfilFinanceiroId", "mesReferencia");

-- CreateIndex
CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_fixa_mesReferencia_idx" ON "Despesa"("usuarioId", "perfilFinanceiroId", "fixa", "mesReferencia");

-- CreateIndex
CREATE INDEX "Despesa_usuarioId_perfilFinanceiroId_paga_dataVencimento_idx" ON "Despesa"("usuarioId", "perfilFinanceiroId", "paga", "dataVencimento");

-- CreateIndex
CREATE INDEX "Despesa_cartaoCreditoId_usuarioId_idx" ON "Despesa"("cartaoCreditoId", "usuarioId");

-- CreateIndex
CREATE INDEX "Despesa_parcelamentoId_usuarioId_idx" ON "Despesa"("parcelamentoId", "usuarioId");

-- CreateIndex
CREATE INDEX "DespesaExcecaoRecorrencia_usuarioId_mesReferencia_idx" ON "DespesaExcecaoRecorrencia"("usuarioId", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "DespesaExcecaoRecorrencia_despesaId_usuarioId_mesReferencia_key" ON "DespesaExcecaoRecorrencia"("despesaId", "usuarioId", "mesReferencia");

-- CreateIndex
CREATE INDEX "CartaoCredito_usuarioId_perfilFinanceiroId_deletedAt_idx" ON "CartaoCredito"("usuarioId", "perfilFinanceiroId", "deletedAt");

-- CreateIndex
CREATE INDEX "Sugestao_usuarioId_criadoEm_idx" ON "Sugestao"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "Sugestao_tipo_criadoEm_idx" ON "Sugestao"("tipo", "criadoEm");

-- CreateIndex
CREATE INDEX "ContatoSuporte_status_criadoEm_idx" ON "ContatoSuporte"("status", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_usuarioId_idx" ON "PushToken"("usuarioId");

-- AddForeignKey
ALTER TABLE "SessaoUsuario" ADD CONSTRAINT "SessaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilFinanceiro" ADD CONSTRAINT "PerfilFinanceiro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoPremium" ADD CONSTRAINT "PagamentoPremium_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_perfilFinanceiroId_fkey" FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaExcecaoRecorrencia" ADD CONSTRAINT "ReceitaExcecaoRecorrencia_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaExcecaoRecorrencia" ADD CONSTRAINT "ReceitaExcecaoRecorrencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_cartaoCreditoId_fkey" FOREIGN KEY ("cartaoCreditoId") REFERENCES "CartaoCredito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_perfilFinanceiroId_fkey" FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaExcecaoRecorrencia" ADD CONSTRAINT "DespesaExcecaoRecorrencia_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "Despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaExcecaoRecorrencia" ADD CONSTRAINT "DespesaExcecaoRecorrencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoCredito" ADD CONSTRAINT "CartaoCredito_perfilFinanceiroId_fkey" FOREIGN KEY ("perfilFinanceiroId") REFERENCES "PerfilFinanceiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartaoCredito" ADD CONSTRAINT "CartaoCredito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sugestao" ADD CONSTRAINT "Sugestao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

