-- Adiciona a validade do plano premium no usuario.
ALTER TABLE "Usuario" ADD COLUMN "premiumExpiraEm" TIMESTAMP(3);

-- Usuarios que ja estavam premium recebem 1 mes de validade a partir da migracao.
UPDATE "Usuario"
SET "premiumExpiraEm" = NOW() + INTERVAL '1 month'
WHERE "plano" = 'PREMIUM';
