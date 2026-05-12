import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { mercadoPagoPreference } from "../../lib/mercadopago";

interface CriarCheckoutPremiumUseCaseRequest {
  usuarioId: string;
  appUrl: string;
  frontendUrl: string;
  premiumPrice: number;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class CriarCheckoutPremiumUseCase {
  async execute({
    usuarioId,
    appUrl,
    frontendUrl,
    premiumPrice,
  }: CriarCheckoutPremiumUseCaseRequest) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    const pagamento = await prisma.pagamentoPremium.create({
      data: {
        usuarioId,
        externalReference: randomUUID(),
        valor: premiumPrice,
      },
    });

    const preference = await mercadoPagoPreference.create({
      body: {
        external_reference: pagamento.externalReference,
        notification_url: `${appUrl}/webhooks/mercado-pago`,
        auto_return: "approved",
        back_urls: {
          success: `${frontendUrl}/premium/sucesso`,
          pending: `${frontendUrl}/premium/pendente`,
          failure: `${frontendUrl}/premium/falha`,
        },
        payer: {
          email: usuario.email,
          name: usuario.nome,
        },
        items: [
          {
            id: "premium",
            title: "Plano Premium",
            description: "Acesso ao plano Premium do Fiorote Financas",
            quantity: 1,
            currency_id: "BRL",
            unit_price: premiumPrice,
          },
        ],
        metadata: {
          pagamentoId: pagamento.id,
          usuarioId,
        },
      },
    });

    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point;

    await prisma.pagamentoPremium.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreferenceId: preference.id,
        checkoutUrl,
      },
    });

    return {
      pagamentoId: pagamento.id,
      preferenceId: preference.id,
      checkoutUrl,
      sandboxCheckoutUrl: preference.sandbox_init_point,
    };
  }
}
