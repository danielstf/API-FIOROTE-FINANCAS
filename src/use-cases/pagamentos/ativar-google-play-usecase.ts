import { prisma } from "../../lib/prisma";
import { env } from "../../env";
import {
  buscarAssinanteRevenuecat,
  calcularExpiracaoPorEntitlement,
  entitlementAtivo,
  RevenueCatErroError,
} from "../../lib/revenuecat";

interface AtivarGooglePlayUseCaseRequest {
  usuarioId: string;
  revenuecatUserId: string;
}

export class CompraGooglePlayNaoValidadaError extends Error {
  constructor() {
    super("Compra não encontrada ou não autorizada pelo RevenueCat.");
  }
}

export class RevenueCatNaoConfiguradoError extends Error {
  constructor() {
    super("Pagamento via Google Play não está disponível no momento.");
  }
}

export class AtivarGooglePlayUseCase {
  async execute({ usuarioId, revenuecatUserId }: AtivarGooglePlayUseCaseRequest) {
    if (!env.REVENUECAT_SECRET_KEY) {
      throw new RevenueCatNaoConfiguradoError();
    }

    let subscriber;
    try {
      subscriber = await buscarAssinanteRevenuecat(revenuecatUserId, env.REVENUECAT_SECRET_KEY);
    } catch (err) {
      if (err instanceof RevenueCatErroError && err.status === 404) {
        throw new CompraGooglePlayNaoValidadaError();
      }
      throw err;
    }

    const entitlement = entitlementAtivo(subscriber, env.REVENUECAT_ENTITLEMENT_ID);

    if (!entitlement) {
      throw new CompraGooglePlayNaoValidadaError();
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
