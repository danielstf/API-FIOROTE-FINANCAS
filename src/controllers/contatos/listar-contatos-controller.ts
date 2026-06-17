import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";

export async function listarContatosController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const contatos = await prisma.contatoSuporte.findMany({
    orderBy: { criadoEm: "desc" },
  });

  return reply.status(200).send({ contatos });
}
