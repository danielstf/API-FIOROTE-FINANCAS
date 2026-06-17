import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

const paramsSchema = z.object({ contatoId: z.string().uuid() });

export async function finalizarContatoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { contatoId } = paramsSchema.parse(request.params);

  const contato = await prisma.contatoSuporte.update({
    where: { id: contatoId },
    data: { status: "FINALIZADO" },
  });

  return reply.status(200).send(contato);
}
