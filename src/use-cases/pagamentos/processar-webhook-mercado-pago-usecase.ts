import { PagamentoStatus } from "@prisma/client";
import { mercadoPagoPayment } from "../../lib/mercadopago";
import { prisma } from "../../lib/prisma";
import { calcularPremiumExpiraEm } from "./premium-validade";

interface ProcessarWebhookMercadoPagoUseCaseRequest {
  paymentId: string;
}

export function mapMercadoPagoStatus(status: string | undefined) {
  // Converte os status do Mercado Pago para os status internos do Prisma.
  switch (status) {
    case "approved":
      return PagamentoStatus.APPROVED;
    case "cancelled":
      return PagamentoStatus.CANCELLED;
    case "refunded":
    case "charged_back":
      return PagamentoStatus.REFUNDED;
    case "rejected":
      return PagamentoStatus.REJECTED;
    default:
      return PagamentoStatus.PENDING;
  }
}

type MercadoPagoPaymentData = {
  id?: string | number;
  status?: string;
  external_reference?: string;
};

export async function aplicarPagamentoMercadoPago(payment: MercadoPagoPaymentData) {
  const externalReference = payment.external_reference;

  if (!externalReference) {
    return null;
  }

  const pagamento = await prisma.pagamentoPremium.findUnique({
    where: { externalReference },
  });

  if (!pagamento) {
    return null;
  }

  const status = mapMercadoPagoStatus(payment.status);

  const pagamentoAtualizado = await prisma.pagamentoPremium.update({
    where: { id: pagamento.id },
    data: {
      status,
      mercadoPagoPaymentId: payment.id ? String(payment.id) : pagamento.mercadoPagoPaymentId,
    },
  });

  if (status === PagamentoStatus.APPROVED) {
    await prisma.usuario.update({
      where: { id: pagamento.usuarioId },
      data: {
        plano: "PREMIUM",
        exibirAnuncios: false,
        premiumExpiraEm: calcularPremiumExpiraEm(),
      },
    });
  }

  return pagamentoAtualizado;
}

export class ProcessarWebhookMercadoPagoUseCase {
  async execute({ paymentId }: ProcessarWebhookMercadoPagoUseCaseRequest) {
    // Busca os dados oficiais do pagamento diretamente na API do Mercado Pago.
    const payment = await mercadoPagoPayment.get({ id: paymentId });
    await aplicarPagamentoMercadoPago(payment);
  }
}
