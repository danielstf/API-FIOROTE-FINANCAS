import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirReceitaFactory } from "../../factory/receitas-factory/excluir-receita-factory";
import { ReceitaNaoEncontradaError } from "../../use-cases/receitas/obter-receita-usecase";

const excluirReceitaParamsSchema = z.object({
  receitaId: z.string().uuid("Id da receita invalido"),
});

export async function excluirReceitaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { receitaId } = excluirReceitaParamsSchema.parse(request.params);

  try {
    const excluirReceita = makeExcluirReceitaFactory();

    await excluirReceita.execute({
      usuarioId: request.user.sub,
      receitaId,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ReceitaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao excluir receita:", error);
    return reply.status(500).send({ message: "Erro ao excluir receita" });
  }
}
