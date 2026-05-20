import { FastifyReply } from "fastify";
import { prisma } from "./prisma";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "../use-cases/pagamentos/premium-validade";

export async function bloquearRecursoPremiumSeNecessario(
  usuarioId: string,
  recursoPremium: boolean | undefined,
  reply: FastifyReply,
) {
  if (!recursoPremium) return false;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      plano: true,
      premiumExpiraEm: true,
      exibirAnuncios: true,
    },
  });

  if (!usuario) {
    reply.status(404).send({ message: "Usuario nao encontrado" });
    return true;
  }

  const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

  if (!usuarioTemPremiumAtivo(usuarioAtualizado)) {
    reply.status(403).send({ message: "Recurso disponivel apenas no Premium" });
    return true;
  }

  return false;
}
