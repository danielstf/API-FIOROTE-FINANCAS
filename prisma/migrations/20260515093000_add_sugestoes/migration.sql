CREATE TYPE "SugestaoTipo" AS ENUM ('RECLAMACAO', 'ELOGIO', 'SUGESTAO', 'OUTRO');

CREATE TABLE "Sugestao" (
    "id" TEXT NOT NULL,
    "tipo" "SugestaoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Sugestao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Sugestao_usuarioId_criadoEm_idx" ON "Sugestao"("usuarioId", "criadoEm");
CREATE INDEX "Sugestao_tipo_criadoEm_idx" ON "Sugestao"("tipo", "criadoEm");

ALTER TABLE "Sugestao" ADD CONSTRAINT "Sugestao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
