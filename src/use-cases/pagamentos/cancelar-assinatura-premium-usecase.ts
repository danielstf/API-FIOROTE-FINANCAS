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

    if (!assinatura?.mercadoPagoPreapprovalId) {
      throw new AssinaturaPremiumNaoEncontradaError();
    }

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

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        plano: "PREMIUM",
        exibirAnuncios: false,
        premiumExpiraEm: usuarioAtual.premiumExpiraEm,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        plano: true,
        premiumExpiraEm: true,
      },
    });

    return { usuario };
  }
}
