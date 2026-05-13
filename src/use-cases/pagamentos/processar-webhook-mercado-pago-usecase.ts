import { PagamentoStatus } from "@prisma/client";
import { mercadoPagoPayment } from "../../lib/mercadopago";
import { prisma } from "../../lib/prisma";
import { calcularPremiumExpiraEm } from "./premium-validade";

interface ProcessarWebhookMercadoPagoUseCaseRequest {
  paymentId: string;
}

function mapMercadoPagoStatus(status: string | undefined) {
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

export class ProcessarWebhookMercadoPagoUseCase {
  async execute({ paymentId }: ProcessarWebhookMercadoPagoUseCaseRequest) {
    // Busca os dados oficiais do pagamento diretamente na API do Mercado Pago.
    const payment = await mercadoPagoPayment.get({ id: paymentId });
    const externalReference = payment.external_reference;

    // Sem referencia externa nao e possivel relacionar o pagamento ao registro local.
    if (!externalReference) {
      return;
    }

    // A referencia externa liga o pagamento do Mercado Pago ao pagamento premium salvo.
    const pagamento = await prisma.pagamentoPremium.findUnique({
      where: { externalReference },
    });

    // Se o pagamento local nao existir, o webhook e ignorado sem quebrar a entrega.
    if (!pagamento) {
      return;
    }

    const status = mapMercadoPagoStatus(payment.status);

    // Mantem o historico local sincronizado com o status e id retornados pelo Mercado Pago.
    await prisma.pagamentoPremium.update({
      where: { id: pagamento.id },
      data: {
        status,
        mercadoPagoPaymentId: String(payment.id),
      },
    });

    // Pagamentos aprovados liberam o plano premium e removem anuncios do usuario.
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
  }
}
