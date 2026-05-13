import { FastifyReply, FastifyRequest } from "fastify";
import { makeListarCartoesFactory } from "../../factory/cartoes-factory/listar-cartoes-factory";

export async function listarCartoesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const listarCartoes = makeListarCartoesFactory();

    const resultado = await listarCartoes.execute({
      usuarioId: request.user.sub,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    console.error("Erro ao listar cartoes:", error);
    return reply.status(500).send({ message: "Erro ao listar cartoes" });
  }
}
