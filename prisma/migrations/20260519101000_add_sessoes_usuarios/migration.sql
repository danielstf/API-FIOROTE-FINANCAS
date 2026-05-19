CREATE TABLE "SessaoUsuario" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" TIMESTAMP(3) NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SessaoUsuario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessaoUsuario_usuarioId_idx" ON "SessaoUsuario"("usuarioId");
CREATE INDEX "SessaoUsuario_atualizadaEm_idx" ON "SessaoUsuario"("atualizadaEm");
CREATE INDEX "SessaoUsuario_expiraEm_idx" ON "SessaoUsuario"("expiraEm");

ALTER TABLE "SessaoUsuario"
  ADD CONSTRAINT "SessaoUsuario_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
