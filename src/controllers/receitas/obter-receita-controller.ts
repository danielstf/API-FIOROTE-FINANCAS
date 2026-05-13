import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeObterReceitaFactory } from "../../factory/receitas-factory/obter-receita-factory";
import { ReceitaNaoEncontradaError } from "../../use-cases/receitas/obter-receita-usecase";

const obterReceitaParamsSchema = z.object({
  receitaId: z.string().uuid("Id da receita invalido"),
});

export async function obterReceitaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { receitaId } = obterReceitaParamsSchema.parse(request.params);

  try {
    const obterReceita = makeObterReceitaFactory();

    const receita = await obterReceita.execute({
      usuarioId: request.user.sub,
      receitaId,
    });

    return reply.status(200).send(receita);
  } catch (error) {
    if (error instanceof ReceitaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao obter receita:", error);
    return reply.status(500).send({ message: "Erro ao obter receita" });
  }
}
