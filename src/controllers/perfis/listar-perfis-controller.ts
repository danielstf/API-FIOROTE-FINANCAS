import { FastifyReply, FastifyRequest } from "fastify";
import { makeListarPerfisFactory } from "../../factory/perfis-factory";

export async function listarPerfisController(request: FastifyRequest, reply: FastifyReply) {
  const useCase = makeListarPerfisFactory();
  const data = await useCase.execute(request.user.sub);
  return reply.status(200).send(data);
}