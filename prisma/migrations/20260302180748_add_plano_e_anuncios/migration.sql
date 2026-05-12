-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('FREE', 'PREMIUM');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "exibirAnuncios" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plano" "Plano" NOT NULL DEFAULT 'FREE';
