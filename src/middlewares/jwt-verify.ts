import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";

export async function JWTVerify(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    if (request.user.sid) {
      await prisma.sessaoUsuario.updateMany({
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
    }
  } catch {
    return reply.status(401).send({ message: "not authorized" });
  }
}
