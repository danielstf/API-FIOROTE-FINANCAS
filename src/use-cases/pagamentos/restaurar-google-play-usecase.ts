import { prisma } from "../../lib/prisma";
import {
  calcularPremiumExpiraEm,
  usuarioTemPremiumAtivo,
} from "./premium-validade";

interface RestaurarGooglePlayUseCaseRequest {
  usuarioId: string;
  revenuecatUserId: string;
}

export class RestaurarGooglePlayUseCase {
  async execute({ usuarioId }: RestaurarGooglePlayUseCaseRequest) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, plano: true, premiumExpiraEm: true, exibirAnuncios: true },
    });

    if (!usuario) {
      return { premium: false };
    }

    // Se o premium já está ativo, apenas retorna sem alterar
    if (usuarioTemPremiumAtivo(usuario)) {
      const diasRestantes = Math.ceil(
        (usuario.premiumExpiraEm!.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return {
        premium: true,
        premiumExpiraEm: usuario.premiumExpiraEm!.toISOString(),
        premiumDiasRestantes: diasRestantes,
      };
    }

    // Usuário confirmou via RevenueCat que tem compra ativa — ativa premium por 1 mês
    const premiumExpiraEm = calcularPremiumExpiraEm();

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
