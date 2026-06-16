import { prisma } from "../../lib/prisma";
import { calcularPremiumExpiraEm } from "./premium-validade";

interface AtivarGooglePlayUseCaseRequest {
  usuarioId: string;
  purchaseToken: string;
  productId: string;
  tipo: "RECORRENTE" | "AVULSO";
  revenuecatUserId?: string;
}

export class AtivarGooglePlayUseCase {
  async execute({ usuarioId, productId, tipo }: AtivarGooglePlayUseCaseRequest) {
    const premiumExpiraEm =
      tipo === "RECORRENTE" || productId === "premium_mensal"
        ? calcularPremiumExpiraEm()
        : calcularPremiumExpiraEm30Dias();

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        plano: "PREMIUM",
        premiumExpiraEm,
        exibirAnuncios: false,
      },
    });

    const diasRestantes = Math.ceil(
      (premiumExpiraEm.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      premium: true,
      premiumExpiraEm: premiumExpiraEm.toISOString(),
      premiumDiasRestantes: diasRestantes,
    };
  }
}

function calcularPremiumExpiraEm30Dias() {
  const expira = new Date();
  expira.setDate(expira.getDate() + 30);
  return expira;
}
