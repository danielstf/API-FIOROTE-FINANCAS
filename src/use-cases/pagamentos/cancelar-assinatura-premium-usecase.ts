import { prisma } from "../../lib/prisma";
import { mercadoPagoPreapproval } from "../../lib/mercadopago";

interface CancelarAssinaturaPremiumUseCaseRequest {
  usuarioId: string;
}

export class AssinaturaPremiumNaoEncontradaError extends Error {
  constructor() {
    super("Assinatura premium ativa nao encontrada");
  }
}

export class CancelarAssinaturaPremiumUseCase {
  async execute({ usuarioId }: CancelarAssinaturaPremiumUseCaseRequest) {
    const usuarioAtual = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        plano: true,
        premiumExpiraEm: true,
      },
    });

    if (!usuarioAtual || usuarioAtual.plano !== "PREMIUM") {
      throw new AssinaturaPremiumNaoEncontradaError();
    }

    const assinatura = await prisma.pagamentoPremium.findFirst({
      where: {
        usuarioId,
        tipo: "ASSINATURA",
        mercadoPagoPreapprovalId: { not: null },
        status: { in: ["APPROVED", "PENDING"] },
      },
      orderBy: { criadoEm: "desc" },
    });

    if (assinatura?.mercadoPagoPreapprovalId) {
      const preapproval = await mercadoPagoPreapproval.cancel(
        assinatura.mercadoPagoPreapprovalId,
      );

      await prisma.pagamentoPremium.update({
        where: { id: assinatura.id },
        data: {
          status: "CANCELLED",
          assinaturaStatus: preapproval.status ?? "canceled",
          canceladoEm: new Date(),
        },
      });
    } else {
      const ultimoPagamento = await prisma.pagamentoPremium.findFirst({
        where: {
          usuarioId,
          status: "APPROVED",
        },
        orderBy: { criadoEm: "desc" },
      });

      if (ultimoPagamento) {
        await prisma.pagamentoPremium.update({
          where: { id: ultimoPagamento.id },
          data: {
            status: "CANCELLED",
            canceladoEm: new Date(),
          },
        });
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        plano: "FREE",
        exibirAnuncios: true,
        premiumExpiraEm: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        plano: true,
        premiumExpiraEm: true,
        senha: true,
      },
    });

    return {
      usuario: {
        ...usuario,
        temSenha: Boolean(usuario.senha),
        senha: undefined,
      },
    };
  }
}
