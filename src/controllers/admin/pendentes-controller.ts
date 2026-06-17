import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";

export async function pendentesController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const [sugestoes, contatos] = await Promise.all([
    prisma.sugestao.count({ where: { status: "ABERTO" } }),
    prisma.contatoSuporte.count({ where: { status: "ABERTO" } }),
  ]);

  return reply.status(200).send({ sugestoes, contatos, total: sugestoes + contatos });
}
