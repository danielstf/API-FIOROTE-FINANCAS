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
    reply.status(404).send({ message: "Usuário não encontrado." });
    return true;
  }

  const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

  if (!usuarioTemPremiumAtivo(usuarioAtualizado)) {
    reply.status(403).send({
      message: "Este recurso está disponível apenas para usuários Premium.",
    });
    return true;
  }

  return false;
}
