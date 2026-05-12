import { PagamentoStatus } from "@prisma/client";
import { mercadoPagoPayment } from "../../lib/mercadopago";
import { prisma } from "../../lib/prisma";

interface ProcessarWebhookMercadoPagoUseCaseRequest {
  paymentId: string;
}

function mapMercadoPagoStatus(status: string | undefined) {
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

export class ProcessarWebhookMercadoPagoUseCase {
  async execute({ paymentId }: ProcessarWebhookMercadoPagoUseCaseRequest) {
    const payment = await mercadoPagoPayment.get({ id: paymentId });
    const externalReference = payment.external_reference;

    if (!externalReference) {
      return;
    }

    const pagamento = await prisma.pagamentoPremium.findUnique({
      where: { externalReference },
    });

    if (!pagamento) {
      return;
    }

    const status = mapMercadoPagoStatus(payment.status);

    await prisma.pagamentoPremium.update({
      where: { id: pagamento.id },
      data: {
        status,
        mercadoPagoPaymentId: String(payment.id),
      },
    });

    if (status === PagamentoStatus.APPROVED) {
      await prisma.usuario.update({
        where: { id: pagamento.usuarioId },
        data: {
          plano: "PREMIUM",
          exibirAnuncios: false,
        },
      });
    }
  }
}
