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

CREATE INDEX "ContatoSuporte_status_criadoEm_idx" ON "ContatoSuporte"("status", "criadoEm");
