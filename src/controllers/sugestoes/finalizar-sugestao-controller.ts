import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { SugestaoRepository } from "../../repositories/repository/sugestoes/sugestao-repository";
import { formatarSugestao } from "../../use-cases/sugestoes/sugestao-dados";

const paramsSchema = z.object({
  sugestaoId: z.string().uuid("Id da sugestao invalido"),
});

export async function finalizarSugestaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sugestaoId } = paramsSchema.parse(request.params);

  try {
    const repository = new SugestaoRepository();
    const sugestao = await repository.finish(sugestaoId);

    return reply.status(200).send(formatarSugestao(sugestao));
  } catch (error) {
    console.error("Erro ao finalizar sugestao:", error);
    return reply.status(500).send({ message: "Erro ao finalizar sugestao" });
  }
}
