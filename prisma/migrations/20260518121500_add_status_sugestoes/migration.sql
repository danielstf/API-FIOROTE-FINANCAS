ALTER TABLE "Sugestao" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ABERTO';
CREATE INDEX "Sugestao_status_criadoEm_idx" ON "Sugestao"("status", "criadoEm");
