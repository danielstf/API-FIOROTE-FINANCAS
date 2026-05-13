import { prisma } from "../../lib/prisma";
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
      ultimoPagamento: ultimoPagamento
        ? {
            ...ultimoPagamento,
            valor: Number(ultimoPagamento.valor),
          }
        : null,
    };
  }
}
