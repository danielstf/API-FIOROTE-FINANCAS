import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import { getPerfilFinanceiroId } from "../lib/perfil-financeiro";

export async function JWTVerify(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    if (!request.user.sid) {
      return reply.status(401).send({ message: "Sua sessão expirou. Faça login novamente." });
    }

    const sessao = await prisma.sessaoUsuario.updateMany({
      where: {
        id: request.user.sid,
        usuarioId: request.user.sub,
        expiraEm: {
          gt: new Date(),
        },
      },
      data: {
        atualizadaEm: new Date(),
        expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    if (sessao.count === 0) {
      return reply.status(401).send({ message: "Sua sessão expirou. Faça login novamente." });
    }

    const perfilFinanceiroId = getPerfilFinanceiroId(request);

    if (perfilFinanceiroId) {
      const perfil = await prisma.perfilFinanceiro.findFirst({
        where: {
          id: perfilFinanceiroId,
          usuarioId: request.user.sub,
        },
      });

      if (!perfil) {
        return reply.status(403).send({
          message: "Não foi possível acessar este perfil financeiro.",
        });
      }
    }
  } catch {
    return reply.status(401).send({ message: "Sua sessão expirou. Faça login novamente." });
  }
}
