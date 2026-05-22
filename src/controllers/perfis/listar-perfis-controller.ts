import { FastifyReply, FastifyRequest } from "fastify";
import { makeListarPerfisFactory } from "../../factory/perfis-factory";
import { bloquearUsuarioSemPremium } from "../../lib/premium-access";

export async function listarPerfisController(request: FastifyRequest, reply: FastifyReply) {
  if (
    await bloquearUsuarioSemPremium(
      request.user.sub,
      reply,
      "Perfis financeiros são exclusivos para usuários VIP.",
    )
  ) {
    return;
  }

  const useCase = makeListarPerfisFactory();
  const data = await useCase.execute(request.user.sub);
  return reply.status(200).send(data);
}
