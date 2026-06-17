import { prisma } from "../lib/prisma";

const DIAS_PENDING = 30;
const DIAS_CANCELLED = 90;

export async function executarLimpezaPagamentosPendentes() {
  const agora = new Date();

  const limitePending = new Date(agora);
  limitePending.setDate(limitePending.getDate() - DIAS_PENDING);

  const limiteCancelled = new Date(agora);
  limiteCancelled.setDate(limiteCancelled.getDate() - DIAS_CANCELLED);

  const [deletadosPending, deletadosCancelled] = await Promise.all([
    prisma.pagamentoPremium.deleteMany({
      where: {
        status: "PENDING",
        mercadoPagoPaymentId: null,
        criadoEm: { lt: limitePending },
      },
    }),
    prisma.pagamentoPremium.deleteMany({
      where: {
        status: "CANCELLED",
        criadoEm: { lt: limiteCancelled },
      },
    }),
  ]);

  const total = deletadosPending.count + deletadosCancelled.count;
  if (total > 0) {
    console.log(
      `[limpeza-pagamentos] Removidos ${deletadosPending.count} PENDING (+${DIAS_PENDING}d) e ${deletadosCancelled.count} CANCELLED (+${DIAS_CANCELLED}d)`,
    );
  }
}
