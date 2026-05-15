import { FastifyReply, FastifyRequest } from "fastify";
import { makeListarSugestoesFactory } from "../../factory/sugestoes-factory/listar-sugestoes-factory";

export async function listarSugestoesController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const listarSugestoes = makeListarSugestoesFactory();
    const sugestoes = await listarSugestoes.execute();

    return reply.status(200).send(sugestoes);
  } catch (error) {
    console.error("Erro ao listar sugestoes:", error);
    return reply.status(500).send({ message: "Erro ao listar sugestoes" });
  }
}
