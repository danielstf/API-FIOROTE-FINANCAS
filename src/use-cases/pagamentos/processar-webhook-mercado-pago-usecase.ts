import { PagamentoStatus } from "@prisma/client";
import { mercadoPagoPayment, mercadoPagoPreapproval } from "../../lib/mercadopago";
import { prisma } from "../../lib/prisma";
import { calcularPremiumExpiraEm } from "./premium-validade";

interface ProcessarWebhookMercadoPagoUseCaseRequest {
  resourceId: string;
  resourceType?: "payment" | "preapproval";
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

type MercadoPagoPreapprovalData = {
  id?: string;
  status?: string;
  external_reference?: string;
  next_payment_date?: string;
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

export async function aplicarAssinaturaMercadoPago(
  preapproval: MercadoPagoPreapprovalData,
) {
  const pagamento = await prisma.pagamentoPremium.findFirst({
    where: {
      OR: [
        { mercadoPagoPreapprovalId: preapproval.id },
        { externalReference: preapproval.external_reference ?? "" },
      ],
    },
  });

  if (!pagamento) {
    return null;
  }

  const assinaturaStatus = preapproval.status;
  const status =
    assinaturaStatus === "authorized"
      ? PagamentoStatus.APPROVED
      : assinaturaStatus === "canceled" || assinaturaStatus === "cancelled"
        ? PagamentoStatus.CANCELLED
        : assinaturaStatus === "paused"
          ? PagamentoStatus.CANCELLED
          : PagamentoStatus.PENDING;

  const pagamentoAtualizado = await prisma.pagamentoPremium.update({
    where: { id: pagamento.id },
    data: {
      status,
      assinaturaStatus,
      mercadoPagoPreapprovalId: preapproval.id ?? pagamento.mercadoPagoPreapprovalId,
      canceladoEm:
        status === PagamentoStatus.CANCELLED
          ? (pagamento.canceladoEm ?? new Date())
          : pagamento.canceladoEm,
    },
  });

  if (status === PagamentoStatus.APPROVED) {
    await prisma.usuario.update({
      where: { id: pagamento.usuarioId },
      data: {
        plano: "PREMIUM",
        exibirAnuncios: false,
        premiumExpiraEm: preapproval.next_payment_date
          ? new Date(preapproval.next_payment_date)
          : calcularPremiumExpiraEm(),
      },
    });
  }

  return pagamentoAtualizado;
}

export class ProcessarWebhookMercadoPagoUseCase {
  async execute({ resourceId, resourceType = "payment" }: ProcessarWebhookMercadoPagoUseCaseRequest) {
    if (resourceType === "preapproval") {
      const preapproval = await mercadoPagoPreapproval.get(resourceId);
      await aplicarAssinaturaMercadoPago(preapproval);
      return;
    }

    // Busca os dados oficiais do pagamento diretamente na API do Mercado Pago.
    const payment = await mercadoPagoPayment.get({ id: resourceId });
    await aplicarPagamentoMercadoPago(payment);
  }
}
