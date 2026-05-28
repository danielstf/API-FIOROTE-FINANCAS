import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { mercadoPagoPreapproval, mercadoPagoPreference } from "../../lib/mercadopago";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "./premium-validade";

interface CriarCheckoutPremiumUseCaseRequest {
  usuarioId: string;
  appUrl: string;
  frontendUrl: string;
  tipo: "MENSAL" | "RECORRENTE";
  premiumMonthlyPrice: number;
  premiumRecurringPrice: number;
  mercadoPagoAccessToken: string;
  mercadoPagoPayerEmail?: string;
  mercadoPagoPreapprovalPlanId?: string;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuário não encontrado.");
  }
}

export class UsuarioJaPremiumError extends Error {
  constructor() {
    super("Usuario ja possui plano Premium");
  }
}

export class MercadoPagoPayerIncompativelError extends Error {
  constructor() {
    super(
      "Credenciais de producao do Mercado Pago nao podem criar assinatura para usuario de teste. Use um e-mail real ou credenciais de uma conta teste compativel.",
    );
  }
}

export class CriarCheckoutPremiumUseCase {
  async execute({
    usuarioId,
    appUrl,
    frontendUrl,
    tipo,
    premiumMonthlyPrice,
    premiumRecurringPrice,
    mercadoPagoAccessToken,
    mercadoPagoPayerEmail,
    mercadoPagoPreapprovalPlanId,
  }: CriarCheckoutPremiumUseCaseRequest) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    // Atualiza o status antes de decidir se pode criar uma nova cobranca.
    const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

    if (usuarioTemPremiumAtivo(usuarioAtualizado)) {
      throw new UsuarioJaPremiumError();
    }

    const pagamentoTipo = tipo === "RECORRENTE" ? "ASSINATURA" : "CHECKOUT";
    const premiumPrice =
      tipo === "RECORRENTE" ? premiumRecurringPrice : premiumMonthlyPrice;

    await prisma.pagamentoPremium.updateMany({
      where: {
        usuarioId,
        status: "PENDING",
        checkoutUrl: { not: null },
      },
      data: {
        status: "CANCELLED",
        canceladoEm: new Date(),
      },
    });

    const payerEmail = mercadoPagoPayerEmail ?? usuario.email;

    if (mercadoPagoAccessToken.startsWith("APP_USR-") && isMercadoPagoTestUser(payerEmail)) {
      throw new MercadoPagoPayerIncompativelError();
    }

    const pagamento = await prisma.pagamentoPremium.create({
      data: {
        usuarioId,
        externalReference: randomUUID(),
        tipo: pagamentoTipo,
        valor: premiumPrice,
      },
    });

    if (tipo === "MENSAL") {
      const preference = await mercadoPagoPreference.create({
        body: {
          external_reference: pagamento.externalReference,
          notification_url: `${appUrl}/webhooks/mercado-pago`,
          back_urls: {
            success: `${frontendUrl}/premium/sucesso`,
            pending: `${frontendUrl}/premium/pendente`,
            failure: `${frontendUrl}/premium/falha`,
          },
          items: [
            {
              id: "premium-mensal",
              title: "Plano Premium Mensal",
              description: "Acesso mensal avulso ao Premium do Fiorote Financas",
              quantity: 1,
              currency_id: "BRL",
              unit_price: premiumPrice,
            },
          ],
          metadata: {
            pagamentoId: pagamento.id,
            usuarioId,
            tipo: "MENSAL",
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
        tipo,
        valor: premiumPrice,
        preferenceId: preference.id,
        preapprovalId: null,
        checkoutUrl,
        sandboxCheckoutUrl: preference.sandbox_init_point,
      };
    }

    const preapproval = await mercadoPagoPreapproval.create(
      mercadoPagoPreapprovalPlanId
        ? {
            preapproval_plan_id: mercadoPagoPreapprovalPlanId,
            external_reference: pagamento.externalReference,
            payer_email: payerEmail,
            back_url: `${frontendUrl}/premium/sucesso`,
            notification_url: `${appUrl}/webhooks/mercado-pago`,
            status: "pending",
          }
        : {
            reason: "Plano Premium Fiorote Financas",
            external_reference: pagamento.externalReference,
            payer_email: payerEmail,
            back_url: `${frontendUrl}/premium/sucesso`,
            notification_url: `${appUrl}/webhooks/mercado-pago`,
            status: "pending",
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: premiumPrice,
              currency_id: "BRL",
            },
          },
    );

    const checkoutUrl = preapproval.init_point ?? preapproval.sandbox_init_point;

    await prisma.pagamentoPremium.update({
      where: { id: pagamento.id },
      data: {
        mercadoPagoPreapprovalId: preapproval.id,
        assinaturaStatus: preapproval.status,
        checkoutUrl,
      },
    });

    return {
      pagamentoId: pagamento.id,
      tipo,
      valor: premiumPrice,
      preferenceId: null,
      preapprovalId: preapproval.id,
      checkoutUrl,
      sandboxCheckoutUrl: preapproval.sandbox_init_point,
    };
  }
}

function isMercadoPagoTestUser(email: string) {
  return email.toLowerCase().endsWith("@testuser.com");
}
