import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma";
import { mercadoPagoPreapproval } from "../../lib/mercadopago";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "./premium-validade";

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

export class UsuarioJaPremiumError extends Error {
  constructor() {
    super("Usuario ja possui plano Premium");
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

    // Atualiza o status antes de decidir se pode criar uma nova cobranca.
    const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

    if (usuarioTemPremiumAtivo(usuarioAtualizado)) {
      throw new UsuarioJaPremiumError();
    }

    const pagamentoPendente = await prisma.pagamentoPremium.findFirst({
      where: {
        usuarioId,
        tipo: "ASSINATURA",
        status: "PENDING",
        checkoutUrl: { not: null },
      },
      orderBy: { criadoEm: "desc" },
    });

    if (pagamentoPendente?.checkoutUrl) {
      return {
        pagamentoId: pagamentoPendente.id,
        preapprovalId: pagamentoPendente.mercadoPagoPreapprovalId,
        checkoutUrl: pagamentoPendente.checkoutUrl,
        sandboxCheckoutUrl: null,
      };
    }

    const pagamento = await prisma.pagamentoPremium.create({
      data: {
        usuarioId,
        externalReference: randomUUID(),
        tipo: "ASSINATURA",
        valor: premiumPrice,
      },
    });

    const preapproval = await mercadoPagoPreapproval.create({
      reason: "Plano Premium Fiorote Financas",
      external_reference: pagamento.externalReference,
      payer_email: usuario.email,
      back_url: `${frontendUrl}/premium/sucesso`,
      notification_url: `${appUrl}/webhooks/mercado-pago`,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: premiumPrice,
        currency_id: "BRL",
      },
    });

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
      preapprovalId: preapproval.id,
      checkoutUrl,
      sandboxCheckoutUrl: preapproval.sandbox_init_point,
    };
  }
}
