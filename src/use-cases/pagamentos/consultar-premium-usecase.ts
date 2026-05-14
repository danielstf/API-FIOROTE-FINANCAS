import { prisma } from "../../lib/prisma";
import { mercadoPagoPayment } from "../../lib/mercadopago";
import { aplicarPagamentoMercadoPago } from "./processar-webhook-mercado-pago-usecase";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "./premium-validade";

interface ConsultarPremiumUseCaseRequest {
  usuarioId: string;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class ConsultarPremiumUseCase {
  async execute({ usuarioId }: ConsultarPremiumUseCaseRequest) {
    await sincronizarPagamentosPendentes(usuarioId);

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        plano: true,
        exibirAnuncios: true,
        premiumExpiraEm: true,
      },
    });

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    // Antes de responder, garante que premium vencido volte para FREE.
    const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

    const ultimoPagamento = await prisma.pagamentoPremium.findFirst({
      where: { usuarioId },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        status: true,
        valor: true,
        checkoutUrl: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    return {
      plano: usuarioAtualizado.plano,
      premium: usuarioTemPremiumAtivo(usuarioAtualizado),
      exibirAnuncios: usuarioAtualizado.exibirAnuncios,
      premiumExpiraEm: usuarioAtualizado.premiumExpiraEm,
      premiumDiasRestantes: calcularDiasRestantes(usuarioAtualizado.premiumExpiraEm),
      ultimoPagamento: ultimoPagamento
        ? {
            ...ultimoPagamento,
            valor: Number(ultimoPagamento.valor),
          }
        : null,
    };
  }
}

function calcularDiasRestantes(premiumExpiraEm: Date | null) {
  if (!premiumExpiraEm) return 0;

  const diff = premiumExpiraEm.getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function sincronizarPagamentosPendentes(usuarioId: string) {
  const pagamentosPendentes = await prisma.pagamentoPremium.findMany({
    where: {
      usuarioId,
      status: "PENDING",
    },
    orderBy: { criadoEm: "desc" },
    take: 3,
  });

  await Promise.all(
    pagamentosPendentes.map(async (pagamento) => {
      try {
        const resultado = await mercadoPagoPayment.search({
          options: {
            external_reference: pagamento.externalReference,
            sort: "date_created",
            criteria: "desc",
          },
        });

        const payment = resultado.results?.[0];

        if (payment) {
          await aplicarPagamentoMercadoPago(payment);
        }
      } catch (error) {
        console.warn("Nao foi possivel sincronizar pagamento pendente:", error);
      }
    }),
  );
}
