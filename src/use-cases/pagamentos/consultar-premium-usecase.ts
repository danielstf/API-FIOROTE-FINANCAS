import { prisma } from "../../lib/prisma";
import { mercadoPagoPayment, mercadoPagoPreapproval } from "../../lib/mercadopago";
import { aplicarPagamentoMercadoPago } from "./processar-webhook-mercado-pago-usecase";
import { aplicarAssinaturaMercadoPago } from "./processar-webhook-mercado-pago-usecase";
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
    const premiumAtivo = usuarioTemPremiumAtivo(usuarioAtualizado);

    if (premiumAtivo && usuarioAtualizado.exibirAnuncios) {
      usuarioAtualizado.exibirAnuncios = false;

      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { exibirAnuncios: false },
      });
    }

    const ultimoPagamento = await prisma.pagamentoPremium.findFirst({
      where: { usuarioId },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        status: true,
        valor: true,
        checkoutUrl: true,
        tipo: true,
        assinaturaStatus: true,
        mercadoPagoPreapprovalId: true,
        canceladoEm: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    return {
      plano: usuarioAtualizado.plano,
      premium: premiumAtivo,
      exibirAnuncios: usuarioAtualizado.exibirAnuncios,
      premiumExpiraEm: usuarioAtualizado.premiumExpiraEm,
      premiumDiasRestantes: calcularDiasRestantes(usuarioAtualizado.premiumExpiraEm),
      ultimoPagamento: ultimoPagamento
        ? {
            ...ultimoPagamento,
            valor: Number(ultimoPagamento.valor),
            assinaturaId: ultimoPagamento.mercadoPagoPreapprovalId,
            mercadoPagoPreapprovalId: undefined,
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
        if (pagamento.tipo === "ASSINATURA" && pagamento.mercadoPagoPreapprovalId) {
          const preapproval = await mercadoPagoPreapproval.get(
            pagamento.mercadoPagoPreapprovalId,
          );
          await aplicarAssinaturaMercadoPago(preapproval);
          return;
        }

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
