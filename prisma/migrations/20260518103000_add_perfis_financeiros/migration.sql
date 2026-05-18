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

CREATE UNIQUE INDEX "PerfilFinanceiro_usuarioId_nome_key" ON "PerfilFinanceiro"("usuarioId", "nome");
CREATE INDEX "PerfilFinanceiro_usuarioId_criadoEm_idx" ON "PerfilFinanceiro"("usuarioId", "criadoEm");

ALTER TABLE "PerfilFinanceiro" ADD CONSTRAINT "PerfilFinanceiro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;