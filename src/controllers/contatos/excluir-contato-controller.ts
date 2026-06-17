import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

const paramsSchema = z.object({ contatoId: z.string().uuid() });

export async function excluirContatoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { contatoId } = paramsSchema.parse(request.params);

  await prisma.contatoSuporte.delete({ where: { id: contatoId } });

  return reply.status(204).send();
}
