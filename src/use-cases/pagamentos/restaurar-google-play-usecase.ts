import { prisma } from "../../lib/prisma";
import { env } from "../../env";
import {
  buscarAssinanteRevenuecat,
  calcularExpiracaoPorEntitlement,
  entitlementAtivo,
  RevenueCatErroError,
} from "../../lib/revenuecat";
import {
  RevenueCatNaoConfiguradoError,
} from "./ativar-google-play-usecase";

interface RestaurarGooglePlayUseCaseRequest {
  usuarioId: string;
  revenuecatUserId: string;
}

export class RestaurarGooglePlayUseCase {
  async execute({ usuarioId, revenuecatUserId }: RestaurarGooglePlayUseCaseRequest) {
    if (!env.REVENUECAT_SECRET_KEY) {
      throw new RevenueCatNaoConfiguradoError();
    }

    let subscriber;
    try {
      subscriber = await buscarAssinanteRevenuecat(revenuecatUserId, env.REVENUECAT_SECRET_KEY);
    } catch (err) {
      if (err instanceof RevenueCatErroError && err.status === 404) {
        return { premium: false };
      }
      throw err;
    }

    const entitlement = entitlementAtivo(subscriber, env.REVENUECAT_ENTITLEMENT_ID);

    if (!entitlement) {
      return { premium: false };
    }

    const premiumExpiraEm = calcularExpiracaoPorEntitlement(entitlement);

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
