import { FastifyReply } from "fastify";
import { prisma } from "./prisma";
import {
  atualizarPremiumExpirado,
  usuarioTemPremiumAtivo,
} from "../use-cases/pagamentos/premium-validade";

const premiumMessage = "Este recurso está disponível apenas para usuários Premium.";

export async function bloquearRecursoPremiumSeNecessario(
  usuarioId: string,
  recursoPremium: boolean | undefined,
  reply: FastifyReply,
) {
  if (!recursoPremium) return false;

  return bloquearUsuarioSemPremium(usuarioId, reply);
}

export async function bloquearUsuarioSemPremium(
  usuarioId: string,
  reply: FastifyReply,
  message = premiumMessage,
) {
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
    reply.status(403).send({ message });
    return true;
  }

  return false;
}
