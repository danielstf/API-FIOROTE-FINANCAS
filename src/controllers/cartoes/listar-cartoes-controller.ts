import { FastifyReply, FastifyRequest } from "fastify";
import { makeListarCartoesFactory } from "../../factory/cartoes-factory/listar-cartoes-factory";
import { getPerfilFinanceiroId } from "../../lib/perfil-financeiro";

export async function listarCartoesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const listarCartoes = makeListarCartoesFactory();

    const resultado = await listarCartoes.execute({
      usuarioId: request.user.sub,
      perfilFinanceiroId: getPerfilFinanceiroId(request),
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    console.error("Erro ao listar cartoes:", error);
    return reply.status(500).send({ message: "Erro ao listar cartoes" });
  }
}
