import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { SugestaoRepository } from "../../repositories/repository/sugestoes/sugestao-repository";

const paramsSchema = z.object({
  sugestaoId: z.string().uuid("Id da sugestao invalido"),
});

export async function excluirSugestaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sugestaoId } = paramsSchema.parse(request.params);

  try {
    const repository = new SugestaoRepository();
    await repository.delete(sugestaoId);

    return reply.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir sugestao:", error);
    return reply.status(500).send({ message: "Erro ao excluir sugestao" });
  }
}
