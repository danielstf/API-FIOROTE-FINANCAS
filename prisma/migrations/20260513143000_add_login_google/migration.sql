-- Permite usuarios criados via Google sem senha local.
ALTER TABLE "Usuario" ADD COLUMN "googleId" TEXT;
ALTER TABLE "Usuario" ALTER COLUMN "senha" DROP NOT NULL;

CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");
